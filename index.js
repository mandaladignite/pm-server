import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import { app } from "./src/app.js";


dotenv.config();



connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port: ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("Mongo db connection failed : ",err)
})
// its sample file for server