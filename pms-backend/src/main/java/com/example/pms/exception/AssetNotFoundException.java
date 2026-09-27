package com.example.pms.exception;


public class AssetNotFoundException extends RuntimeException{

    public AssetNotFoundException(){
        super("Asset Not Found.");
    }

}
