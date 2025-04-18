import dotenv from 'dotenv'
import connectDB from "./db/dbConnection.js";
import { app } from './app.js';
dotenv.config({
    path:"./.env"
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log(error.message);
})













// (
//     async () => {
//         try {
//             await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`)
//             app.on('error',(error)=>{
//                 console.log('ERR:',error); 
//                 throw error
//             })

//             app.listen(process.env.PORT,()=>{
//                 console.log(`APP is listening on ${process.env.PORT}`);
//             })
//         } catch (error) {
//             console.log(error.message);
//             process.exit(1)
//         }
//     }
// )()

