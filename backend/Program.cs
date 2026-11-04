using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.Hubs;
using NavbharatAgroAPI.Middleware;
using NavbharatAgroAPI.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Standard ASP.NET Core syntax: 'ConnectionStrings__DefaultConnection' environment variable
// automatically maps to builder.Configuration.GetConnectionString("DefaultConnection")
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Direct environment variable check for ConnectionStrings__DefaultConnection or DEFAULT_CONNECTION
var envConnStr = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                 ?? Environment.GetEnvironmentVariable("DEFAULT_CONNECTION");

if (!string.IsNullOrWhiteSpace(envConnStr))
{
    connectionString = envConnStr;
}
else
{
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        try
        {
            var databaseUri = new Uri(databaseUrl);
            var userInfo = databaseUri.UserInfo.Split(':');

            var builderDb = new Npgsql.NpgsqlConnectionStringBuilder
            {
                Host = databaseUri.Host,
                Port = databaseUri.IsDefaultPort ? 5432 : databaseUri.Port,
                Username = userInfo.Length > 0 ? userInfo[0] : "",
                Password = userInfo.Length > 1 ? userInfo[1] : "",
                Database = databaseUri.LocalPath.TrimStart('/'),
                SslMode = Npgsql.SslMode.Prefer
            };

            connectionString = builderDb.ToString();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Warning] Failed to parse DATABASE_URL: {ex.Message}. Falling back to default connection.");
        }
    }
    else if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PGHOST")))
    {
        var builderDb = new Npgsql.NpgsqlConnectionStringBuilder
        {
            Host = Environment.GetEnvironmentVariable("PGHOST"),
            Port = int.TryParse(Environment.GetEnvironmentVariable("PGPORT"), out var dbPort) ? dbPort : 5432,
            Username = Environment.GetEnvironmentVariable("PGUSER"),
            Password = Environment.GetEnvironmentVariable("PGPASSWORD"),
            Database = Environment.GetEnvironmentVariable("PGDATABASE"),
            SslMode = Npgsql.SslMode.Prefer
        };

        connectionString = builderDb.ToString();
    }
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// In-Memory Revocation Cache and Services
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IDeviceRevocationCache, DeviceRevocationCache>();
builder.Services.AddScoped<ITokenService, TokenService>();

// JWT Authentication Configuration
var jwtSecret = builder.Configuration["Jwt:Key"] ?? "NavbharatAgroSecureSuperSecretKeyForJwtAuthentication2026!#$";
var jwtKey = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);

    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = new List<string>
        {
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:5173",
            "https://localhost:3000",
            "https://localhost:3001",
            "https://localhost:3002",
            "https://localhost:5173",
            "https://yourdomain.com",
            "https://www.yourdomain.com",
            "https://g-track.4mindia.com"
        };

        var customFrontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
        if (!string.IsNullOrWhiteSpace(customFrontendUrl))
        {
            var splitUrls = customFrontendUrl.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            allowedOrigins.AddRange(splitUrls);
        }

        policy.WithOrigins(allowedOrigins.Distinct().ToArray())
              .SetIsOriginAllowed(origin =>
              {
                  if (string.IsNullOrWhiteSpace(origin)) return false;
                  try
                  {
                      var uri = new Uri(origin);
                      // Allow localhost and local loopback on any port
                      if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) || 
                          uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
                      {
                          return true;
                      }

                      // Allow future Vercel deployment URLs and previews (*.vercel.app)
                      if (uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                      {
                          return true;
                      }

                      // Allow custom production domains (https://yourdomain.com and https://www.yourdomain.com)
                      if (uri.Host.Equals("yourdomain.com", StringComparison.OrdinalIgnoreCase) ||
                          uri.Host.Equals("www.yourdomain.com", StringComparison.OrdinalIgnoreCase) ||
                          uri.Host.EndsWith(".yourdomain.com", StringComparison.OrdinalIgnoreCase))
                      {
                          return true;
                      }

                      // Allow 4mindia domains if configured
                      if (uri.Host.Equals("4mindia.com", StringComparison.OrdinalIgnoreCase) ||
                          uri.Host.EndsWith(".4mindia.com", StringComparison.OrdinalIgnoreCase))
                      {
                          return true;
                      }
                  }
                  catch
                  {
                      // Ignore invalid URIs
                  }
                  return false;
              })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        // Apply database migrations
        context.Database.Migrate();

        // Reset TodayTravelledDistance to 0 as requested
        context.Database.ExecuteSqlRaw(@"
            ALTER TABLE ""Employees"" ADD COLUMN IF NOT EXISTS ""LastSeenTimestamp"" timestamp with time zone NULL;
            ALTER TABLE ""Employees"" ADD COLUMN IF NOT EXISTS ""DeviceId"" text NULL;
            ALTER TABLE ""Employees"" ADD COLUMN IF NOT EXISTS ""PendingDeviceId"" text NULL;
            ALTER TABLE ""Employees"" ADD COLUMN IF NOT EXISTS ""DeviceChangeStatus"" text NULL;
            ALTER TABLE ""Employees"" ADD COLUMN IF NOT EXISTS ""BatteryLevel"" integer NULL;
        ");
        context.Database.ExecuteSqlRaw(@"
            UPDATE ""Employees"" 
            SET ""TodayTravelledDistance"" = 0 
            WHERE ""TripStatus"" != 'Started' OR ""TripStartTime"" IS NULL;
        ");
        context.Database.ExecuteSqlRaw(@"
            UPDATE ""Employees"" 
            SET ""LastLatitude"" = NULL, ""LastLongitude"" = NULL, ""LastKnownAddress"" = NULL, ""LastLocationTimestamp"" = NULL 
            WHERE ""TripStatus"" != 'Started';
        ");

        // Ensure Devices table exists with proper indexes and columns
        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ""Devices"" (
                ""Id"" uuid NOT NULL PRIMARY KEY,
                ""EmployeeId"" integer NOT NULL REFERENCES ""Employees""(""Id"") ON DELETE CASCADE,
                ""DeviceId"" character varying(128) NOT NULL,
                ""DeviceName"" character varying(128),
                ""PushToken"" character varying(256),
                ""Status"" integer NOT NULL DEFAULT 0,
                ""Latitude"" double precision,
                ""Longitude"" double precision,
                ""LocationName"" text,
                ""Reason"" text,
                ""RequestedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                ""ActionAt"" timestamp with time zone,
                ""ActionBy"" character varying(128),
                ""LastUsed"" timestamp with time zone NOT NULL DEFAULT NOW(),
                ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                ""RefreshToken"" character varying(256),
                ""RefreshTokenExpiryTime"" timestamp with time zone
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Devices_EmployeeId_DeviceId"" ON ""Devices"" (""EmployeeId"", ""DeviceId"");
            CREATE INDEX IF NOT EXISTS ""IX_Devices_EmployeeId_Status"" ON ""Devices"" (""EmployeeId"", ""Status"");
        ");

        // Seed initial data
        DbInitializer.SeedEmployees(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Database initialization failed.");
    }
}

app.UseSwagger();

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Navbharat Agro API V1");
    c.RoutePrefix = "swagger";
});

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<DeviceRevocationMiddleware>();

app.MapControllers();
app.MapHub<TrackingHub>("/hubs/tracking");

app.MapGet("/health", () => Results.Ok("Healthy"));

// Bind Kestrel dynamically to PORT environment variable (fallback to 8080 if not set, or 5160 in local development)
var portEnv = Environment.GetEnvironmentVariable("PORT");
var bindPort = !string.IsNullOrWhiteSpace(portEnv) 
    ? portEnv 
    : (app.Environment.IsDevelopment() ? "5160" : "8080");

app.Urls.Clear();
app.Urls.Add($"http://0.0.0.0:{bindPort}");
Console.WriteLine($"[Kestrel] Server bound to http://0.0.0.0:{bindPort}");
app.MapGet("/", () => "G-Mart Tracking API is running successfully!");
app.Run();
