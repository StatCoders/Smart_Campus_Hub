package com.smartcampus.backend.dto.auth;

import com.google.gson.annotations.SerializedName;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GoogleTokenInfo {
    @SerializedName("iss")
    private String iss;
    
    @SerializedName("azp")
    private String azp;
    
    @SerializedName("aud")
    private String aud;
    
    @SerializedName("sub")
    private String sub;
    
    @SerializedName("email")
    private String email;
    
    @SerializedName("email_verified")
    private Boolean emailVerified;
    
    @SerializedName("name")
    private String name;
    
    @SerializedName("picture")
    private String picture;
    
    @SerializedName("given_name")
    private String givenName;
    
    @SerializedName("family_name")
    private String familyName;
}
