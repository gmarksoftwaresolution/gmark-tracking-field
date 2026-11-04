namespace NavbharatAgroAPI.Services
{
    public interface IDeviceRevocationCache
    {
        void RevokeDevice(string deviceId);
        void ClearRevokedDevice(string deviceId);
        bool IsDeviceRevoked(string deviceId);
    }
}

