using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Services
{
    public interface IGeocodingService
    {
        Task<string> GetAddressFromCoordinatesAsync(double latitude, double longitude);
    }

    public class GeocodingService : IGeocodingService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeocodingService> _logger;
        private readonly HttpClient _httpClient;

        public GeocodingService(IConfiguration configuration, ILogger<GeocodingService> logger, HttpClient httpClient)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<string> GetAddressFromCoordinatesAsync(double latitude, double longitude)
        {
            var apiKey = _configuration["GoogleGeocodingAPIKey"] 
                      ?? Environment.GetEnvironmentVariable("GOOGLE_GEOCODING_API_KEY");

            if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Contains("YOUR_GOOGLE_GEOCODING_API_KEY"))
            {
                _logger.LogInformation("Google Geocoding API key not configured. Using coordinate fallback string.");
                return $"Lat: {latitude:F4}, Lng: {longitude:F4}";
            }

            try
            {
                var requestUrl = $"https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key={apiKey}";
                var response = await _httpClient.GetAsync(requestUrl);

                if (response.IsSuccessStatusCode)
                {
                    var jsonString = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(jsonString);
                    var root = doc.RootElement;
                    var status = root.GetProperty("status").GetString();

                    if (status == "OK" && root.TryGetProperty("results", out var results) && results.GetArrayLength() > 0)
                    {
                        var formattedAddress = results[0].GetProperty("formatted_address").GetString();
                        if (!string.IsNullOrWhiteSpace(formattedAddress))
                        {
                            return formattedAddress;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Google Geocoding API for Lat: {Lat}, Lng: {Lng}", latitude, longitude);
            }

            return $"Lat: {latitude:F4}, Lng: {longitude:F4}";
        }
    }
}
