using NavbharatAgroAPI.Models;
using System.Security.Claims;

namespace NavbharatAgroAPI.Services
{
    public interface ITokenService
    {
        string GenerateAccessToken(Employee employee, string deviceId);
        string GenerateRefreshToken();
        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    }
}

