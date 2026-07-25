# Base runtime image (.NET 8)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Build image (.NET 8)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore
COPY ["NavbharatAgroAPI.csproj", "./"]
RUN dotnet restore "NavbharatAgroAPI.csproj"

# Copy source
COPY . .

# Build
RUN dotnet build "NavbharatAgroAPI.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "NavbharatAgroAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "NavbharatAgroAPI.dll"]