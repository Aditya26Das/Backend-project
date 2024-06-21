import { configDotenv } from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

const port = process.env.PORT || 8000;

configDotenv({
    path: './.env'
})

connectDB()
.then(() => {
    app.on('error', (error) => {
        console.log('error : ',error)
        throw error
    })

    app.listen(port, () => {
        console.log(`Server is running on port : ${port}`)
    })
})
.catch((err) => {
    console.log("MongoDB COnnection Failed!!! ",err)
})