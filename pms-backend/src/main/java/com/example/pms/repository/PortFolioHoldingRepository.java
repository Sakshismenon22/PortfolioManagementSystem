package com.example.pms.repository;

import com.example.pms.model.Portfolio;
import com.example.pms.model.PortfolioHolding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortFolioHoldingRepository extends JpaRepository<PortfolioHolding,Integer> {

    List<PortfolioHolding> findAllByPortfolio(Portfolio portfolio);

    void deleteAllByPortfolio(Portfolio portfolio);

}
