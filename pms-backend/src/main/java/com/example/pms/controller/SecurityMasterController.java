package com.example.pms.controller;


import com.example.pms.dto.response.SecuritiesInfoDTO;
import com.example.pms.model.SecurityMaster;
import com.example.pms.response.Response;
import com.example.pms.service.SecurityMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/security")
public class SecurityMasterController {

    private final SecurityMasterService securityMasterService;

    @GetMapping("/get-all-security-info")
    public ResponseEntity<?> getAllSecurityInfo(){
        return new ResponseEntity<>(new Response<SecuritiesInfoDTO>(HttpStatus.OK.value(), true, securityMasterService.getAllSecuritiesInfo(), "All securities info retrieved.", LocalDateTime.now()),HttpStatus.OK);
    }

}
