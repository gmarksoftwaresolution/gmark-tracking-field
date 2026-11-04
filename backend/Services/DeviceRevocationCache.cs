using Microsoft.Extensions.Caching.Memory;
using System;

namespace NavbharatAgroAPI.Services
{
    public class DeviceRevocationCache : IDeviceRevocationCache
    {
        private readonly IMemoryCache _cache;
        private static readonly TimeSpan DefaultRevocationDuration = TimeSpan.FromDays(7);

        public DeviceRevocationCache(IMemoryCache cache)
        {
            _cache = cache;
        }

        public void RevokeDevice(string deviceId)
        {
            if (string.IsNullOrWhiteSpace(deviceId)) return;
            var key = GetCacheKey(deviceId);
            _cache.Set(key, true, DefaultRevocationDuration);
        }

        public void ClearRevokedDevice(string deviceId)
        {
            if (string.IsNullOrWhiteSpace(deviceId)) return;
            var key = GetCacheKey(deviceId);
            _cache.Remove(key);
        }

        public bool IsDeviceRevoked(string deviceId)
        {
            if (string.IsNullOrWhiteSpace(deviceId)) return false;
            var key = GetCacheKey(deviceId);
            return _cache.TryGetValue(key, out bool isRevoked) && isRevoked;
        }

        private static string GetCacheKey(string deviceId) => $"revoked_device_{deviceId.Trim().ToLowerInvariant()}";
    }
}

