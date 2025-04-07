
import { v2 as cloudinary } from 'cloudinary';

import fs from "fs"


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null
        }
        const response = await cloudinary.uploader.upload(localFilePath,
            {
                resource_type: "auto",
                folder:"videotube"
            }
        )
        console.log(`file is uploaded successfully ${response.url}`);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}


const destroyOnCloudinary = async (publicId) => {
    try {
        const response = await cloudinary.uploader.destroy(publicId,{
            resource_type: "auto",
            folder:"videotube"
        });
        return response;
    } catch (error) {
        return null;
    }
}

export { uploadOnCloudinary,
    destroyOnCloudinary
    
 }