# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies (leveraging Docker layer caching)
COPY NavbharatAgroAPI.csproj ./
RUN dotnet restore NavbharatAgroAPI.csproj

# Copy all source files and publish release build
COPY . ./
RUN dotnet publish NavbharatAgroAPI.csproj -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Production Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published application from build stage
COPY --from=build /app/publish .

# Default port configuration for Railway and cloud container environments
ENV PORT=8080
ENV ASPNETCORE_URLS=http://0.0.0.0:8080

EXPOSE 8080

# Execute the application assembly
ENTRYPOINT ["dotnet", "NavbharatAgroAPI.dll"]
