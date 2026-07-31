namespace NavbharatAgroAPI.DTOs
{
    public class LookupDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? City { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
