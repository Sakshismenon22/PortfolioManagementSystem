package com.example.pms.service;

import com.example.pms.dto.response.SecuritiesInfoDTO;
import org.springframework.stereotype.Service;

import java.util.List;


public interface SecurityMasterService {

    public SecuritiesInfoDTO getAllSecuritiesInfo();

}
