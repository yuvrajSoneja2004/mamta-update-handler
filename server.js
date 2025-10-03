const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware - allows all origins by default
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Read config.json
function readConfig() {
  try {
    const configPath = path.join(__dirname, "config.json");
    const configData = fs.readFileSync(configPath, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    console.error("Error reading config.json:", error);
    return null;
  }
}

// Endpoint to check for updates
app.get("/update/:version", (req, res) => {
  try {
    const clientVersion = req.params.version;
    const config = readConfig();

    if (!config) {
      return res.status(500).json({
        success: false,
        error: "Failed to read configuration",
      });
    }

    const currentVersion = config.currentVersion;
    const hasUpdate = clientVersion !== currentVersion;

    res.json({
      success: true,
      hasUpdate: hasUpdate,
      currentVersion: currentVersion,
      clientVersion: clientVersion,
      updateChannel: config.updateChannel,
      message: hasUpdate ? "Update available!" : "You are up to date!",
    });
  } catch (error) {
    console.error("Error in /update endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Endpoint to download the update file
app.get("/download-update", (req, res) => {
  try {
    const filePath = path.join(__dirname, "latest.msi");

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "Update file not found. Please contact support.",
      });
    }

    // Set headers for file download
    res.setHeader("Content-Disposition", 'attachment; filename="latest.msi"');
    res.setHeader("Content-Type", "application/octet-stream");

    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Error downloading file",
        });
      }
    });
  } catch (error) {
    console.error("Error in /download-update endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Update manager server is running",
    timestamp: new Date().toISOString(),
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Update manager server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Update check: http://localhost:${PORT}/update/:version`);
  console.log(`Download update: http://localhost:${PORT}/download-update`);
});

module.exports = app;
