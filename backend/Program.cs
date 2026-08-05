using backend.Data;
using backend.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using System.Text;

var builder =
    WebApplication.CreateBuilder(
        args
    );

builder.Services.AddControllers();

/*
 * ---------------------------------------
 * DATABASE
 * ---------------------------------------
 *
 * Local development:
 * ConnectionStrings:DefaultConnection
 * from appsettings.json.
 *
 * Production:
 * environment variable:
 *
 * ConnectionStrings__DefaultConnection
 */
var connectionString =
    builder.Configuration
        .GetConnectionString(
            "DefaultConnection"
        );

if (
    string.IsNullOrWhiteSpace(
        connectionString
    )
)
{
    throw new InvalidOperationException(
        "Database connection string is missing."
    );
}

builder.Services
    .AddDbContext<AppDbContext>(
        options =>
            options.UseNpgsql(
                connectionString
            )
    );

/*
 * ---------------------------------------
 * APPLICATION SERVICES
 * ---------------------------------------
 */
builder.Services
    .AddScoped<
        SeasonPlayerImportService
    >();

builder.Services
    .AddHttpClient<
        LimitlessSnapshotService
    >();

builder.Services
    .AddHttpClient<
        LimitlessResultsService
    >();

/*
 * ---------------------------------------
 * CORS
 * ---------------------------------------
 *
 * Local:
 * http://localhost:3000
 *
 * Production:
 * Frontend:Url
 *
 * Environment variable:
 * Frontend__Url
 */
var frontendUrl =
    builder.Configuration[
        "Frontend:Url"
    ];

var allowedOrigins =
    new List<string>
    {
        "http://localhost:3000"
    };

if (
    !string.IsNullOrWhiteSpace(
        frontendUrl
    )
)
{
    allowedOrigins.Add(
        frontendUrl.TrimEnd('/')
    );
}

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "Frontend",
            policy =>
            {
                policy
                    .WithOrigins(
                        allowedOrigins
                            .Distinct()
                            .ToArray()
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            }
        );
    }
);

/*
 * ---------------------------------------
 * JWT AUTHENTICATION
 * ---------------------------------------
 *
 * Production environment variables:
 *
 * Jwt__Key
 * Jwt__Issuer
 * Jwt__Audience
 */
var jwtKey =
    builder.Configuration[
        "Jwt:Key"
    ];

var jwtIssuer =
    builder.Configuration[
        "Jwt:Issuer"
    ];

var jwtAudience =
    builder.Configuration[
        "Jwt:Audience"
    ];

if (
    string.IsNullOrWhiteSpace(
        jwtKey
    )
)
{
    throw new InvalidOperationException(
        "JWT key is missing."
    );
}

if (
    string.IsNullOrWhiteSpace(
        jwtIssuer
    )
)
{
    throw new InvalidOperationException(
        "JWT issuer is missing."
    );
}

if (
    string.IsNullOrWhiteSpace(
        jwtAudience
    )
)
{
    throw new InvalidOperationException(
        "JWT audience is missing."
    );
}

builder.Services
    .AddAuthentication(
        JwtBearerDefaults
            .AuthenticationScheme
    )
    .AddJwtBearer(
        options =>
        {
            options
                .TokenValidationParameters =
                new TokenValidationParameters
                {
                    ValidateIssuer =
                        true,

                    ValidateAudience =
                        true,

                    ValidateLifetime =
                        true,

                    ValidateIssuerSigningKey =
                        true,

                    ValidIssuer =
                        jwtIssuer,

                    ValidAudience =
                        jwtAudience,

                    IssuerSigningKey =
                        new SymmetricSecurityKey(
                            Encoding.UTF8
                                .GetBytes(
                                    jwtKey
                                )
                        ),

                    ClockSkew =
                        TimeSpan.Zero
                };
        }
    );

builder.Services
    .AddAuthorization();

var app =
    builder.Build();

/*
 * ---------------------------------------
 * HTTP PIPELINE
 * ---------------------------------------
 */
app.UseCors(
    "Frontend"
);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

/*
 * ---------------------------------------
 * DATABASE SETUP
 * ---------------------------------------
 *
 * In Development:
 * keep your existing automatic seed.
 *
 * In Production:
 * do NOT automatically reseed every
 * startup.
 */
if (
    app.Environment
        .IsDevelopment()
)
{
    using var scope =
        app.Services.CreateScope();

    var dbContext =
        scope.ServiceProvider
            .GetRequiredService<
                AppDbContext
            >();

    await DbSeeder.SeedAsync(
        dbContext
    );
}

app.Run();