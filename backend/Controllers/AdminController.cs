using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly SeasonPlayerImportService _seasonPlayerImportService;
    private readonly LimitlessSnapshotService _limitlessSnapshotService;
    private readonly IConfiguration _configuration;

    public AdminController(
        SeasonPlayerImportService seasonPlayerImportService,
        LimitlessSnapshotService limitlessSnapshotService,
        IConfiguration configuration)
    {
        _seasonPlayerImportService =
            seasonPlayerImportService;

        _limitlessSnapshotService =
            limitlessSnapshotService;

        _configuration =
            configuration;
    }

    [HttpPost("import-season-players")]
    public async Task<ActionResult> ImportSeasonPlayers()
    {
        if (!IsAppAdmin())
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Admin access required."
            );
        }

        try
        {
            var importedCount =
                await _seasonPlayerImportService
                    .ImportAsync();

            return Ok(new
            {
                importedCount,

                message =
                    "Season player pool imported successfully."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                error =
                    ex.Message
            });
        }
    }

    [HttpPost("snapshot-limitless")]
    public async Task<ActionResult> SnapshotLimitless()
    {
        if (!IsAppAdmin())
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Admin access required."
            );
        }

        try
        {
            var players =
                await _limitlessSnapshotService
                    .CreateSnapshotAsync();

            return Ok(new
            {
                players =
                    players.Count,

                firstPlayer =
                    players.First().Name,

                lastPlayer =
                    players.Last().Name,

                message =
                    "Limitless Top 150 snapshot created successfully."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                error =
                    ex.Message
            });
        }
    }

    private bool IsAppAdmin()
    {
        var userEmail =
            User.FindFirstValue(
                ClaimTypes.Email
            );

        var adminEmail =
            _configuration[
                "Admin:Email"
            ];

        if (
            string.IsNullOrWhiteSpace(
                userEmail
            ) ||
            string.IsNullOrWhiteSpace(
                adminEmail
            )
        )
        {
            return false;
        }

        return string.Equals(
            userEmail.Trim(),
            adminEmail.Trim(),
            StringComparison.OrdinalIgnoreCase
        );
    }
}