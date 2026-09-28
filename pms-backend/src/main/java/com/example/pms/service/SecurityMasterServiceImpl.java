package com.example.pms.service;

import com.example.pms.client.SecurityMasterClient;
import com.example.pms.dto.response.SecuritiesInfoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Service
public class SecurityMasterServiceImpl implements SecurityMasterService{

    private final SecurityMasterClient securityMasterClient;

    @Override
    public SecuritiesInfoDTO getAllSecuritiesInfo() {
        return securityMasterClient.getAllSecurityInfo().get();
    }
}
