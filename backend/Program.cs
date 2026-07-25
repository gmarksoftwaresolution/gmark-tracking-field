using Microsoft.EntityFrameworkCore;
using NavbharatAgroAPI.Data;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(databaseUrl))
{
    var databaseUri = new Uri(databaseUrl);
    var userInfo = databaseUri.UserInfo.Split(':');

    var builderDb = new Npgsql.NpgsqlConnectionStringBuilder
    {
        Host = databaseUri.Host,
        Port = databaseUri.IsDefaultPort ? 5432 : databaseUri.Port,
        Username = userInfo[0],
        Password = userInfo[1],
        Database = databaseUri.LocalPath.TrimStart('/')
    };

    connectionString = builderDb.ToString();
}
else if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PGHOST")))
{
    var builderDb = new Npgsql.NpgsqlConnectionStringBuilder
    {
        Host = Environment.GetEnvironmentVariable("PGHOST"),
        Port = int.TryParse(Environment.GetEnvironmentVariable("PGPORT"), out var dbPort) ? dbPort : 5432,
        Username = Environment.GetEnvironmentVariable("PGUSER"),
        Password = Environment.GetEnvironmentVariable("PGPASSWORD"),
        Database = Environment.GetEnvironmentVariable("PGDATABASE")
    };

    connectionString = builderDb.ToString();
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddControllers();

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
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
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

app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Ok("Healthy"));

var port = Environment.GetEnvironmentVariable("PORT");

if (!string.IsNullOrEmpty(port))
{
    app.Urls.Add($"http://0.0.0.0:{port}");
}
app.MapGet("/", () => "G-Mart Tracking API is running successfully!");
app.Run();