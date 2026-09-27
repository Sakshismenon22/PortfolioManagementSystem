package com.example.pms.model;

import com.example.pms.model.enums.InvestmentHorizon;
import com.example.pms.model.enums.Risk;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "themes")
public class Theme {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    private String name;

    private Risk risk;

    private InvestmentHorizon investmentHorizon;

    @OneToMany
    private List<AllocationRule> allocationRuleList;

    private Boolean status;

    @ManyToOne
    private User createdBy;
}
