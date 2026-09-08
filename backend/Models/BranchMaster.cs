using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace NavbharatAgroAPI.Models
{
    public class BranchMaster
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string BranchName { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string BranchCode { get; set; } = string.Empty;

        [StringLength(50)]
        public string? City { get; set; }

        [StringLength(50)]
        public string? State { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();

        [JsonIgnore]
        public ICollection<HolidayMaster> Holidays { get; set; } = new List<HolidayMaster>();
    }
}
