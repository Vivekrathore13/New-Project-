// require vala syntax

// require('dotenv').config({path:'./env'});

import dotenv from "dotenv";

import mongoose from "mongoose";
import {db_name} from './constants.js';

// it is effi function in javascript
import express from "express";

dotenv.config({
  path:'./env'
})
const app =express();

(async () => {
  try{
   await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`)
   app.on("error", ()=>{
    console.log("error",error);
    throw error
   })
   app.listen(process.env.PORT, () => {
    console.log(`App is listening on port ${process.env.PORT}`)
   })
  } catch(error) {
    console.error("MONGODB CONNECTION FAILED:",error)
    throw error
  }
})()