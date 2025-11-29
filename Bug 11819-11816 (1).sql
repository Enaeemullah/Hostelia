DELIMITER $$

USE `loan`$$

DROP FUNCTION IF EXISTS `FN_RF_ACCOUNT_PENALTY_ACCRUAL_AMOUNT`$$

CREATE DEFINER=`root`@`%` FUNCTION `FN_RF_ACCOUNT_PENALTY_ACCRUAL_AMOUNT`(
  porOrgacode VARCHAR (10),
  dmpProdcode VARCHAR (5),
  mbmBkmsnumber VARCHAR (20),
  pchChrgcode VARCHAR (3),
  bnaAcntaccrualrate DECIMAL(20,6)
) RETURNS DECIMAL(20,6)
    NO SQL
    DETERMINISTIC
BEGIN
  DECLARE v_out DECIMAL (20, 6) DEFAULT 0 ;
  DECLARE credit_type VARCHAR(2);
  DECLARE utilized_amount DECIMAL(20,6);
  DECLARE loan_end_date DATE;
  DECLARE company_date DATE;
  DECLARE outstandingPenalty DECIMAL(20,6);
  DECLARE outstandingMarkup DECIMAL(20,6);
  DECLARE penalty_after_30days DATE;
  DECLARE penalty_after_210days DATE;
    DECLARE penalty_after_2years DATE;
  DECLARE rf_penalty_count INT;
  DECLARE dmp_prodcode INT;
    
  SELECT product.dmp_credittype,lc.mbm_bkmsbalance,lc.bla_lnacmaturitydate, gp.bgp_glprcompanydate, 
  (lcr.pch_chrgaccruedamt - lcr.pch_chrgpostedamt), rf_penaltycount ,
  (lcm.pch_chrgaccruedamt - lcm.pch_chrgpostedamt), product.dmp_prodcode
  INTO credit_type,utilized_amount, loan_end_date, company_date,outstandingPenalty, rf_penalty_count, outstandingMarkup, dmp_prodcode 
   FROM `bn_pd_lp_loanproduct` product LEFT JOIN `bn_ms_la_loanaccount` lc ON lc.dmp_prodcode = product.dmp_prodcode 
   AND lc.por_orgacode = product.por_orgacode LEFT JOIN `bn_ap_gp_globalparameter` gp ON gp.por_orgacode = product.por_orgacode 
   LEFT JOIN 
  `bn_ms_lc_loanaccountchargerecord` lcr ON lcr.por_orgacode = product.por_orgacode 
  AND lcr.dmp_prodcode = product.dmp_prodcode AND lcr.pch_chrgcode = '103' AND lcr.mbm_bkmsnumber = mbmBkmsnumber 
   LEFT JOIN 
  `bn_ms_lc_loanaccountchargerecord` lcm ON lcm.por_orgacode = product.por_orgacode 
  AND lcm.dmp_prodcode = product.dmp_prodcode AND lcm.pch_chrgcode = '102' AND lcm.mbm_bkmsnumber = mbmBkmsnumber 
  WHERE product.dmp_prodcode = dmpProdcode AND product.por_orgacode = porOrgacode 
  AND lc.mbm_bkmsnumber = mbmBkmsnumber;
  
  
IF dmp_prodcode = '311' THEN
    SET penalty_after_2years = DATE_ADD(loan_end_date, INTERVAL 0 DAY);
    
    IF pchChrgcode = '103' AND credit_type = 'R' THEN
        IF rf_penalty_count < 1 AND company_date > penalty_after_2years THEN
            SET v_out = (utilized_amount + outstandingMarkup + outstandingPenalty) * 0.20;
            UPDATE bn_ms_la_loanaccount
            SET rf_penaltycount = 1
            WHERE por_orgacode = porOrgacode 
            AND dmp_prodcode = dmpProdcode
            AND mbm_bkmsnumber = mbmBkmsnumber;
        END IF;
    END IF;

ELSE
    SET penalty_after_30days = DATE_ADD(loan_end_date, INTERVAL 0 DAY);
    SET penalty_after_210days = DATE_ADD(loan_end_date, INTERVAL 210 DAY);
    
    IF pchChrgcode = '103' AND credit_type = 'R' THEN
        IF rf_penalty_count < 1 AND company_date > penalty_after_30days AND company_date <= penalty_after_210days THEN
            SET v_out = 210 * (bnaAcntaccrualrate * utilized_amount / 365); -- firstPenalty
            UPDATE bn_ms_la_loanaccount
            SET rf_penaltycount = 1
            WHERE por_orgacode = porOrgacode 
            AND dmp_prodcode = dmpProdcode
            AND mbm_bkmsnumber = mbmBkmsnumber;
        END IF;
        
        IF rf_penalty_count <= 1 AND company_date > penalty_after_210days THEN
            SET v_out = (utilized_amount + outstandingMarkup + outstandingPenalty) * 0.20; -- secondPenalty
            UPDATE bn_ms_la_loanaccount
            SET rf_penaltycount = 2
            WHERE por_orgacode = porOrgacode 
            AND dmp_prodcode = dmpProdcode
            AND mbm_bkmsnumber = mbmBkmsnumber;
        END IF;
    END IF;

END IF;



  RETURN (v_out) ;
END$$

DELIMITER ;
