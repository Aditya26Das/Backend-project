import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

export const uploadOnCloudinary = async(localFilePath) =>{
    try {
        if (!localFilePath) return null;
        else
        {
            //upload the file on cloudinary
            const uploadResult = await cloudinary.uploader
            .upload(
                localFilePath, {
                    resource_type : "auto" //auto
                }
            )
            return uploadResult;
        }
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

// (async function() {

//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url('shoes', {
//         fetch_format: 'auto',
//         quality: 'auto'
//     });
    
//     console.log(optimizeUrl);
    
//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url('shoes', {
//         crop: 'auto',
//         gravity: 'auto',
//         width: 500,
//         height: 500,
//     });
    
//     console.log(autoCropUrl);
// })();