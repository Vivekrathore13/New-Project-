import { v2 as cloudinary } from 'cloudinary';
import fs, { unlink, unlinkSync } from 'fs'

 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_CLOUD_APIKEY, 
        api_secret: process.env.CLOUDINARY_CLOUD_APIKEY_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadOnCloudinary=async (localfilepath) => {
      try {
        if(!localfilepath) return null
        //upload the file on cloudinary
       const response= await cloudinary.uploader.upload(localfilepath,{resource_type:"auto"})
        // console.log("file is uploaded on cloudinary", response.url);
        fs.unlinkSync(localfilepath)
        
        return response;
      } catch(error) {
        fs,unlinkSync(localfilepath)
        // remove the locally saved temporary file as the upload operation got failed
        return null;
      }
    }

    const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId)
    } catch (error) {
        console.log("Cloudinary delete error", error)
    }
}


const getPublicIdFromUrl = (url) => {
    const parts = url.split("/")
    const fileName = parts[parts.length - 1]
    const folder = parts[parts.length - 2]
    const publicId = `${folder}/${fileName.split(".")[0]}`
    return publicId
}

    export {uploadOnCloudinary,deleteFromCloudinary,getPublicIdFromUrl}