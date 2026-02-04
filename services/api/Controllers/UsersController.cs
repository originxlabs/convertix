using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PdfEditor.Api.Services;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UserStore _users;
    private readonly JwtTokenService _tokens;

    public UsersController(UserStore users, JwtTokenService tokens)
    {
        _users = users;
        _tokens = tokens;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "Email and password are required." });
        }

        var existing = await _users.GetByEmailAsync(request.Email);
        if (existing is not null)
        {
            return Conflict(new { error = "Email already exists." });
        }

        var result = await _users.CreateUserAsync(request.Email, request.Password, request.OrgId);
        var token = _tokens.CreateToken(result.UserId, result.Email);
        return Ok(new { userId = result.UserId, email = result.Email, token });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "Email and password are required." });
        }

        var auth = await _users.GetAuthByEmailAsync(request.Email);
        if (auth is null)
        {
            return Unauthorized(new { error = "Invalid credentials." });
        }

        var ok = UserStore.VerifyPassword(request.Password, auth.Value.Salt, auth.Value.Hash);
        if (!ok)
        {
            return Unauthorized(new { error = "Invalid credentials." });
        }

        var token = _tokens.CreateToken(auth.Value.UserId, auth.Value.Email);
        return Ok(new { userId = auth.Value.UserId, email = auth.Value.Email, token });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? string.Empty;
        var email = User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? string.Empty;
        return Ok(new { userId, email });
    }
}

public record RegisterRequest(string Email, string Password, string? OrgId);
public record LoginRequest(string Email, string Password);
