using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/session")]
public class SessionController : ControllerBase
{
    private readonly JwtTokenService _tokens;

    public SessionController(JwtTokenService tokens)
    {
        _tokens = tokens;
    }

    [HttpPost]
    public IActionResult Create() => Ok(new { sessionId = Guid.NewGuid().ToString("N") });

    [Authorize]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromServices] TokenRevocationStore revocations)
    {
        var userId = User.FindFirst("sub")?.Value ?? string.Empty;
        var email = User.FindFirst("email")?.Value ?? string.Empty;
        var jti = User.FindFirst("jti")?.Value;
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized();
        }
        if (!string.IsNullOrWhiteSpace(jti))
        {
            await revocations.RevokeAsync(jti, DateTime.UtcNow.AddHours(12));
        }
        var token = _tokens.CreateToken(userId, email);
        return Ok(new { token });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromServices] TokenRevocationStore revocations)
    {
        var jti = User.FindFirst("jti")?.Value;
        if (string.IsNullOrWhiteSpace(jti))
        {
            return Ok();
        }
        await revocations.RevokeAsync(jti, DateTime.UtcNow.AddHours(12));
        return Ok();
    }
}
