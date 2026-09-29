package com.example.pms.repository;

import com.example.pms.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssetRepository extends JpaRepository<Asset,Integer> {

    Asset findByAssetClass(String assetClass);
}
