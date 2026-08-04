using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly SeasonPlayerImportService _seasonPlayerImportService;
    private readonly LimitlessSnapshotService _limitlessSnapshotService;

    public AdminController(
        SeasonPlayerImportService seasonPlayerImportService,
        LimitlessSnapshotService limitlessSnapshotService)
    {
        _seasonPlayerImportService =
            seasonPlayerImportService;

        _limitlessSnapshotService =
            limitlessSnapshotService;
    }

    [HttpPost("import-season-players")]
    public async Task<ActionResult> ImportSeasonPlayers()
    {
        try
        {
            var importedCount =
                await _seasonPlayerImportService.ImportAsync();

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
                error = ex.Message
            });
        }
    }

    [HttpPost("snapshot-limitless")]
    public async Task<ActionResult> SnapshotLimitless()
    {
        try
        {
            var players =
                await _limitlessSnapshotService
                    .CreateSnapshotAsync();

            return Ok(new
            {
                players = players.Count,
                firstPlayer = players.First().Name,
                lastPlayer = players.Last().Name,
                message =
                    "Limitless Top 150 snapshot created successfully."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                error = ex.Message
            });
        }
    }
}