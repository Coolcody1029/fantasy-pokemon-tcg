using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly IConfiguration _configuration;

    public AuthController(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;

        _passwordHasher =
            new PasswordHasher<User>();
    }

    /*
     * Register a new account.
     */
    [HttpPost("register")]
    public async Task<ActionResult> Register(
        RegisterRequest request)
    {
        var username =
            request.Username.Trim();

        var email =
            request.Email
                .Trim()
                .ToLowerInvariant();

        if (
            string.IsNullOrWhiteSpace(
                username
            ) ||
            string.IsNullOrWhiteSpace(
                email
            ) ||
            string.IsNullOrWhiteSpace(
                request.Password
            )
        )
        {
            return BadRequest(
                "Username, email, and password are required."
            );
        }

        if (request.Password.Length < 8)
        {
            return BadRequest(
                "Password must be at least 8 characters."
            );
        }

        var emailExists =
            await _context.Users
                .AnyAsync(user =>
                    user.Email == email
                );

        if (emailExists)
        {
            return Conflict(
                "An account with this email already exists."
            );
        }

        var usernameExists =
            await _context.Users
                .AnyAsync(user =>
                    user.Username.ToLower() ==
                    username.ToLower()
                );

        if (usernameExists)
        {
            return Conflict(
                "This username is already taken."
            );
        }

        var user =
            new User
            {
                Username =
                    username,

                Email =
                    email,

                CreatedAt =
                    DateTime.UtcNow
            };

        user.PasswordHash =
            _passwordHasher
                .HashPassword(
                    user,
                    request.Password
                );

        _context.Users.Add(
            user
        );

        await _context
            .SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.CreatedAt
        });
    }

    /*
     * Return the currently authenticated
     * user.
     *
     * The backend also determines whether
     * this account is the application admin.
     */
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult> Me()
    {
        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (
            !int.TryParse(
                userIdClaim,
                out var userId
            )
        )
        {
            return Unauthorized();
        }

        var user =
            await _context.Users
                .FirstOrDefaultAsync(
                    user =>
                        user.Id ==
                        userId
                );

        if (user == null)
        {
            return Unauthorized();
        }

        var adminEmail =
            _configuration[
                "Admin:Email"
            ];

        var isAdmin =
            !string.IsNullOrWhiteSpace(
                adminEmail
            ) &&
            string.Equals(
                user.Email.Trim(),
                adminEmail.Trim(),
                StringComparison.OrdinalIgnoreCase
            );

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.CreatedAt,
            isAdmin
        });
    }

    /*
     * Authenticate an existing account
     * and issue a JWT.
     */
    [HttpPost("login")]
    public async Task<ActionResult> Login(
        LoginRequest request)
    {
        var email =
            request.Email
                .Trim()
                .ToLowerInvariant();

        var user =
            await _context.Users
                .FirstOrDefaultAsync(
                    user =>
                        user.Email ==
                        email
                );

        if (user == null)
        {
            return Unauthorized(
                "Invalid email or password."
            );
        }

        var passwordResult =
            _passwordHasher
                .VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.Password
                );

        if (
            passwordResult ==
            PasswordVerificationResult.Failed
        )
        {
            return Unauthorized(
                "Invalid email or password."
            );
        }

        var token =
            CreateToken(
                user
            );

        return Ok(new
        {
            token,

            user = new
            {
                user.Id,
                user.Username,
                user.Email
            }
        });
    }

    /*
     * Create the authentication JWT.
     */
    private string CreateToken(
        User user)
    {
        var jwtKey =
            _configuration[
                "Jwt:Key"
            ]
            ?? throw new InvalidOperationException(
                "JWT key is missing."
            );

        var claims =
            new List<Claim>
            {
                new(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()
                ),

                new(
                    ClaimTypes.Name,
                    user.Username
                ),

                new(
                    ClaimTypes.Email,
                    user.Email
                )
            };

        var key =
            new SymmetricSecurityKey(
                Encoding.UTF8
                    .GetBytes(
                        jwtKey
                    )
            );

        var credentials =
            new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

        var token =
            new JwtSecurityToken(
                issuer:
                    _configuration[
                        "Jwt:Issuer"
                    ],

                audience:
                    _configuration[
                        "Jwt:Audience"
                    ],

                claims:
                    claims,

                expires:
                    DateTime.UtcNow
                        .AddDays(7),

                signingCredentials:
                    credentials
            );

        return new JwtSecurityTokenHandler()
            .WriteToken(
                token
            );
    }
}

public class RegisterRequest
{
    public string Username
    {
        get;
        set;
    } = string.Empty;

    public string Email
    {
        get;
        set;
    } = string.Empty;

    public string Password
    {
        get;
        set;
    } = string.Empty;
}

public class LoginRequest
{
    public string Email
    {
        get;
        set;
    } = string.Empty;

    public string Password
    {
        get;
        set;
    } = string.Empty;
}