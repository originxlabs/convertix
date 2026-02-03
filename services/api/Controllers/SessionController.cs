using Microsoft.AspNetCore.Mvc;

namespace PdfEditor.Api.Controllers;

[ApiController]
[Route("api/session")]
public class SessionController : ControllerBase
{
    [HttpPost]
    public IActionResult Create() => Ok(new { sessionId = Guid.NewGuid().ToString("N") });
}
