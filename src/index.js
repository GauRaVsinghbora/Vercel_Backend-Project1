import connectDB from "./db/db.js";
import app from "./app.js";

connectDB().then(() => {
    app.on("error", (err) => {
        console.log("Server Error", err);
    });
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on PORT: ${process.env.PORT}`);
    })
    }).catch((err) => {
        console.log("Failed to connect to DB", err);
    })