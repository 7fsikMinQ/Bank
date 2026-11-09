# KIGTE VO & SQL Mapper 전체 정리

## 1. CMMN 모듈

### VO 클래스
| 클래스 | 주요 필드 |
|--------|-----------|
| FilterVO | field, value, operator |
| GridVO | no, startIndex, endIndex, start, limit, total, type, value, sorters, sortList, logicOperator, filters, filterList |
| SortVO | field, sort |
| TnCmmnDetailCodeVO | codeId, codeNm, codeRm, rawCodeId, detailCodeId, rawDetailCodeId, detailCodeNm, detailCodeRm, useAt, registId, registdt, updtId, updtDt, isNew |
| TnAtchFileVO | atchFileId, fileSeq, fileNm, registId, fileSeqs, atchFileDta |
| TnEdmAtchFileVO | edmAtchFileId, fileSeq, fileNm, registId, fileSeqs, edmAtchFileDta |
| TnSptAtchFileVO | sptAtchFileId, fileSeq, fileNm, registId, fileSeqs, sptAtchFileDta |

### SQL Mapper
| 파일 | 주요 Statement IDs | 테이블 |
|------|-------------------|--------|
| Common.xml | selectCmmnDetailCode, selectRecptnTelno, insertSms, selectEmailCnt, selectRecptnEmail, insertEmail, insertJudgAgre, selectHnfTrgtMailList, selectHnfTrgtSmsList | TN_CMMN_DETAIL_CODE, TH_SMS_TRNSMIS, TH_EMAIL_TRNSMIS, TN_JUDG_AGRE, TN_JUDG, TN_MNGR, TN_INSPCT, TN_HNF, TN_CSTS |
| AtchFile.xml | insertAtchFile, deleteAtchFile, selectAtchFile, selectAtchFileDta | TN_ATCH_FILE |
| EdmAtchFile.xml | insertEdmAtchFile, deleteEdmAtchFile, selectEdmAtchFile, selectEdmAtchFileDta | TN_EDM_ATCH_FILE |
| SptAtchFile.xml | insertSptAtchFile, deleteSptAtchFile, selectSptAtchFile, selectSptAtchFileDta | TN_SPT_ATCH_FILE |

---

## 2. MAIN 모듈

### VO 클래스
| 클래스 | 주요 필드 |
|--------|-----------|
| MainVO | se, nm, start, end, color, year, inspctId, judgId, insttNm, type, progrsSttusCd, progrsSttusCdNm, dvlSttusCd, dvlSttusCdNm, audtSttusCd, audtSttusCdNm, ptmSttusCdNm |
| NtcnMsgVO (extends GridVO) | ntcnSn, ntcnAt, ntcnSeCd, rcverId, senrId, ntcnCn, cstsId, registDt, cnfirmDt, senrNm, isEncoded, inspctId, inspctNm |

### SQL Mapper
| 파일 | 주요 Statement IDs | 테이블 |
|------|-------------------|--------|
| Main.xml | selectCalTerm, selectJudgCalTerm, selectInspctCalTerm, selectTnCstsState | TN_EDM_PTM, TN_EDM_PTM_CTGRY, TN_CSTS, TN_SPT_TRGT, TN_OBJC_PD, TN_CMMN_DETAIL_CODE, TN_CLGN_*, TN_PERT_* |
| NtcnMsg.xml | selectList, selectCount, updateNtcnAt, insertNtcnMsg, insertNtcnMngrMsg, insertNtcnInspctMsg, insertNtcnJudgMsg | TH_NTCN_MSG, TN_MNGR, TN_JUDG, TN_INSPCT, TN_USER_AUTH_MAPNG, TN_CSTS |

---

## 3. SYS 모듈

### VO 클래스
| 클래스 | 서브모듈 | 주요 필드 |
|--------|---------|-----------|
| LoginVO | user | userId, userPw, loginDt, authId, joinAt, agreDt, userNm, encodeUserNm, email, authType, pwChgAt, isEncoded, userKind, insttNo |
| TnJudgVO (extends GridVO) | user | judgId, judgNm, judgPw, judgSeCd, email, hmpgAdres, telno, mobileNo, grdtnYear, acqsYear, psitn, psitnKwa, psitnLrstyCd, judgPosblAt, charmnAt, useAt, registId, registDt, updtId, updtDt, judgAsignAt, joinAt, recmndYear, pwChgAt, loginDt, agreDt, sendSms, sendEmail, judgSeq, judgSeCdNm, psitnLrstyCdNm, emailChkCo, atchFileId, presentnDt, tmlmtDt, agreOver, agreYear, fileSeq, fileNm, atchFileDta, agreSign, oathSign |
| TnInspctVO (extends GridVO, Cloneable) | user | inspctId, insttNo, inspctPw, inspctClCd, inspctNm, email, adres, psitn, psitnKwa, rspofc, telno, useAt, inspctSe, registId, registDt, updtId, updtDt, changeSttemntDt, pwChgAt, inspctDNm, loginDt, agreDt, joinAt, cstsAt, insttNm, insttSeCd, insttAdres, inspctClCdNm, inspctSeNm |
| TnMngrVO (extends GridVO) | user | mngrId, mngrNm, mngrPw, email, telno, mobileNo, useAt, registId, registDt, updtId, updtDt, judgAsignAt, pwChgAt, loginDt, checkId |
| TnInsttVO (extends GridVO) | user | insttNo, insttNm, insttSeCd, insttSeCdNm, insttCxfc, bsnmNo, insttTelno, zip, adres, detailAdres, hmpgAdres, useAt, registId, registDt, updtId, updtDt, frstSttemntDt, inspctAt, cstsAt |
| TnUserAuthMapngVO | user | authId, userId |
| TnBbsVO | bbs | no, bbsId, bbsKndCd, bbsTrgtCd, bbsTrgtCdNm, bbsSj, bbsCn, wrterId, wrterNm, inqireCo, wrterDt, atchFileId, totalCount, registId, registDt, updtId, updtDt, startIndex, endIndex, searchType, searchTxt, target, bbsIds |
| TnStplatVO | plcy | stplatId, stplatCn, stplatSe, registId, registDt, updtId, updtDt |
| TnQesVO (extends GridVO) | qes | qesId, upperQesId, evlClCd, qesNo, qesTn, answer, qesDc, evlStdr, score, essntlAt, level, registId, registDt, updtId, updtDt, seq, inputMthdCd, inputMthdCdNm |
| ThEmailTrnsmisVO (extends GridVO) | trns | emailSn, trnsmisTyCd, emailSj, emailCn, rcverId, recptnEmail, senrId, senrEmail, dsptchDt, host, hostPw, cstsId |
| ThSmsTrnsmisVO (extends GridVO) | trns | smsSn, trnsmisTyCd, smsSj, smsCn, smsTyCode, rcverId, recptnTelno, senrId, dsptchTelno, dsptchDt, userType, rcverNm, senrType, authKey, atchImg1~3, imgNm1~3, cstsId |
| TnMaVO (extends GridVO) | ma | id, nm, menuId, upperMenuId, seq, menuNm, upperMenuNm, menuUrl, useAt, menuRm, authId, authNm, authRm, authYn |
| TnCtgryVO (extends GridVO) | ctval | ctgryId, ctgryCn, useAt, registId, registDt, updtId, updtDt |
| TnValdtWordsVO (extends GridVO) | ctval | valdtWordsId, valdtWordsKnd, valdtWordsCn, note, useAt, registId, registDt, updtId, updtDt, valdtSeCd, valdtSeCdNm |
| TnObjcPdVO (extends GridVO) | term | objcPdId, inspctId, objcBeginDt, objcEndDt, registId, registDt, updtId, updtDt, objcCd, inspctNm, insttNm, cstsId, cstsYear |
| ComptVO (extends GridVO) | dvl | cstsId, inspctNm, inspctId, InsttNm, clgnTotSttus, pertTotSttus, docTotSttus, totComptSttus, dvlSttusCdNm, dvlSttusCd, cstsYear |
| TnEmbfetDissVO (extends GridVO) | dvl | dissNo, dissNm, useAt, registId, registDt, updtId, updtDt |
| TnMoralsDissVO (extends GridVO) | dvl | moralsDissNo, moralsDissNm, useAt, registId, registDt, updtId, updtDt |
| TnPrhibtGeneVO (extends GridVO) | dvl | prhibtGeneNo, prhibtGeneNtfc, prhibtGeneNm, prhibtGeneIem, prhibtGeneRm, useAt, registId, registDt, updtId, updtDt |
| TnCellVO (extends GridVO) | fee | cellCodeId, cellSeq, cellClNo, cellSe, inspctNm, inspctNmEng, geneInspctMth, useAt, registId, registDt, updtId, updtDt |
| TnMdlcVO (extends GridVO) | fee | mdlcCodeId, mdlcSeq, mdlcSe, inspctNm, geneNm, inspctPurps, inspctTrgt, inspctMth, useAt, registId, registDt, updtId, updtDt |
| TnNgsVO (extends GridVO) | fee | ngsCodeId, ngsSeq, ngsClNo, ngsSe, inspctNm, inspctNmEng, pnlNm, useAt, registId, registDt, updtId, updtDt |
| TnNmrtrVO (extends GridVO) | fee | nmrtrCodeId, nmrtrSeq, nmrtrClNo, nmrtrSe, inspctNm, inspctNmEng, geneNm, useAt, registId, registDt, updtId, updtDt |

### SQL Mapper
| 파일 | 주요 Statement IDs | 테이블 |
|------|-------------------|--------|
| Login.xml | selectUser, selectUserId, selectLoginUser | TN_MNGR, TN_JUDG, TN_INSPCT, TN_USER_AUTH_MAPNG |
| User.xml | selectMngrList/Detail, insertMngr, updateMngr, deleteMngr, selectInsttList/Detail, insertInstt, updateInstt, selectInspctList/Detail, insertInspct, updateInspct, selectJudgList/Detail, insertJudg, updateJudg, insertJudgAgre, insertAuth, updateAuth, deleteAuth, selectDupCheck, selectAgreImg | TN_MNGR, TN_INSTT, TN_INSPCT, TN_JUDG, TN_JUDG_AGRE, TN_USER_AUTH_MAPNG, TN_ATCH_FILE |
| Bbs.xml | selectList, selectTotalCnt, selectDetail, insertBbs, updateBbs, deleteBbs, updateInqireCo | TN_BBS, TN_CMMN_DETAIL_CODE |
| Policy.xml | selectStplatDetail, updateStplat | TN_STPLAT |
| Qes.xml | selectList, selectLevel, insert, update, delete | TN_QES (recursive), TN_CMMN_DETAIL_CODE |
| Trns.xml | selectEmailTrnsList/Cnt, selectSmsTrnsList/Cnt | TH_EMAIL_TRNSMIS, TH_SMS_TRNSMIS |
| Ma.xml | selectMenuBarList, selectMenuList, insertMenu, selectMenu, updateMenu, deleteMenu, selectAuthorList, deleteMenuAuth, insertMenuAuth, selectAuthList/Cnt | TN_MENU, TN_MENU_AUTH_MAPNG, TN_AUTH, TN_MNGR, TN_INSPCT, TN_JUDG |
| Code.xml | selectCodeList, insertCode, updateCode, deleteCode, selectDetailCodeList, insertDetailCode, updateDetailCode, deleteDetailCode | TN_CMMN_CODE, TN_CMMN_DETAIL_CODE |
| Ctval.xml | selectCtgryList/Cnt, insertCtgry, updateCtgry, selectValdtList/Cnt, insertValdt, updateValdt | TN_CTGRY, TN_VALDT_WORDS |
| Term.xml | selectCstsList, insertCstsTerm, updateCstsTerm, selectJudgAgre, updateAgreTerm, selectObjcList, insertObjcPd, updateObjcPd, selectObjcPd, selectCstsId | TN_INSPCT, TN_CSTS, TN_INSTT, TN_JUDG, TN_JUDG_AGRE, TN_ATCH_FILE, TN_OBJC_PD, TN_TRGT_SLCTN |
| DvlInfo.xml | selectPgList/Cnt, insertPg, updatePg, deletePg (금지유전자), selectEdList/Cnt, insertEd, updateEd, deleteEd (배아태아질환), selectMdList/Cnt, insertMd, updateMd, deleteMd (윤리질환), selectComptList, updateDvlSttus | TN_PRHIBT_GENE, TN_EMBFET_DISS, TN_MORALS_DISS, TN_CSTS, TN_NMRTR, TN_CLGN_*, TN_NLIEM, TN_DISSPD, TN_IDRCH, TN_NGS, TN_CELL, TN_EMBFET, TN_MDTCH, TN_BFDOC_EVL, TN_PERT_*, TN_INSPCT, TN_INSTT, TN_TRGT_SLCTN |
| Cell.xml | selectList, selectCount, insert, update | TN_CELL_CODE |
| Ngs.xml | selectList, selectCount, insert, update | TN_NGS_CODE |
| Mdlc.xml | selectList, selectCount, insert, update | TN_MDLC_CODE |
| Nmrtr.xml | selectList, selectCount, insert, update | TN_NMRTR_CODE |

---

## 4. CSTS 모듈

### VO 클래스 (ce 서브모듈)
| 클래스 | 주요 필드 |
|--------|-----------|
| TnCstsVO | cstsId, cstsNm, inspctId, progrsSttusCd, progrsSttusNm, changeSttemntDt, presentnAt, presentnBeginDt, presentnEndDt, dvlBeginDt, dvlEndDt, dvlSttusCd, registId, registDt, updtId, updtDt, insttSeCd, insttNm, inspctNm, cstsYear, crtfcAt, eachId, changeReqstId, changeSttusCd, dissPredict, idtfRlchAt, dvlAt |
| TnCstsOpertnVO | inspctId, cstsOpertnId, cstsId, inspctOper, nmrtrGnrl, ngsGl, ngsSom, chro, fish, fsis, cma, efNipt, efNiptElse, mdlcTchnlgy, nliem, dissPredict, dissPrevnt, gntcPdg, idtfRlchAt, geneOpertn, inspctAcmslt, sssAt, sssBeginDt, sssEndDt, sssFileId, clsbizAt, clsbizDt, clsbizFileId, etcAt, rm, registId, registDt, updtId, updtDt, sssFileNm, clsbizFileNm, opertnCte, insttSeSttus, insttSeCd, eachId, efChro, efFish |
| TnCstsWrterVO | inspctId, cstsWrterId, cstsId, wrterNm, psitn, rspofc, telno, email, atchFileId, atchFileNm, registId, registDt, updtId, updtDt, changeReqstId, changeReqstSeCd, changeSttusCd, cstsYear |
| TnCstsInsttVO | cstsId, inspctId, clNo, frstSttemntDt, changeSttemntDt, insttNm, inspctNm, insttCxfc, insttSeCd, insttSeNm, zip, adres, insttTelno, geneInspctCo, registId, registDt, updtId, updtDt, cstsInsttId, insttAdres, detailAdres, inspctAdres, insttNo, exists, changeReqstId, changeSttusCd |
| TnHnfVO | cstsId, hnfSeq, inspctPurps, hnfSeCd, hnfSeNm, hnfNm, brthDt, acdmcr, acdmcrNm, grdtnAt, major, careerYear, rspofc, telno, mobileNo, email, ctsAt, ctsSe, atchFileId, atchFileNm, registId, registDt, updtId, updtDt, hnfId, inspctId, eachId, cstsYear, changeReqstId, changeSttusCd, lastChangeReqstId |
| ThCstsInsttVO | changeReqstId, ChangeSttusCd, cstsInsttId, cstsId, clNo, frstSttemntDt, changeSttemntDt, insttNm, inspctNm, insttCxfc, insttSeCd, insttSeNm, zip, insttAdres, inspctAdres, detailAdres, insttTelno, geneInspctCo, registId, registDt, updtId, updtDt |
| TnInsttCrtfcVO | cstsId, InsttCrtfcId, crtCd, crtRealmCd, crtRealmNm, crtResult, registId, registDt, updtId, updtDt, atchFileId, fileNm, crtBeginDt, crtEndDt, inspctId |

### VO 클래스 (cte 서브모듈 - 검사항목)
| 클래스 | 대응 DB 테이블 | 주요 특징 |
|--------|--------------|----------|
| TnCellVO | TN_CELL | 세포유전 검사, 56개 필드 (cellId, cellSeq, cstsId, dissExaminAt, bfInsttAt/bfRsrchAt/bfTrustAt/bfCnsgnAt, yrInsttAt~yrCnsgnAt, cellCodeSe, cellCodeId 등) |
| TnDisspdVO | TN_DISSPD | 질환예측검사, 95개 필드 |
| TnDisspdSnpVO | TN_DISSPD_SNP | SNP 데이터 (snpNo, ethnicity, pubmedId, pVal, orBeta, ci95 등), 45개 필드 |
| TnDisspdSnpEtcVO | TN_DISSPD_SNP_ETC | SNP 검증 (valdtStat, valdtSnst, valdtSpec, valdtPpv, valdtNpv 등), 52개 필드 |
| TnDisspdRelmVO | TN_DISSPD_RELM | 검사영역 상세, 80개 이상 필드 |
| TnNliemVO | TN_NLIEM | 기타검사항목, 90개 이상 필드 |
| TnNliemSnpVO | TN_NLIEM_SNP | 46개 필드 |
| TnNliemSnpEtcVO | TN_NLIEM_SNP_ETC | 54개 필드 |
| TnNliemRelmVO | TN_NLIEM_RELM | 80개 이상 필드 |
| TnIdrchVO | TN_IDRCH | 개인식별/친자확인, 72개 필드 |
| TnEmbfetVO | TN_EMBFET | 배아태아검사/NIPT, 68개 필드 |
| TnMdtchVO | TN_MDTCH | 신의료기술, 55개 필드 |
| TnNgsVO | TN_NGS | NGS 선별급여, 65개 이상 필드 |
| TnNmrtrVO | TN_NMRTR | 분자유전, 59개 필드 |

### SQL Mapper (ce)
| 파일 | 주요 Statement IDs | 주요 테이블 |
|------|-------------------|------------|
| Ce.xml | selectMngrList, selectInspctList, selectCstsInstt, selectCstsInsttInfo, saveCstsInstt, updateCstsInstt, selectGeneInspctCo, selectHnfList, insertHnf, updateHnf, saveGeneInspctCo, deleteHnf, selectCstsOpertn, insertCstsOpertn, updateCstsOpertn, selectOpertnCte, selectCstsWrter, insertCstsWrter, updateCstsWrter, selectInsttCrtfc, insertInsttCrtfc, updateInsttCrtfc, deleteInsttCrtfc, selectCstsYears, updateCstsPresentn, selectChangeReqstAt, selectMngrDnloadList, selectCstsInfo, selectHnfFileInfo, selectCrtfcInspct | TN_CSTS, TN_CMMN_DETAIL_CODE, TN_INSPCT, TN_INSTT, TN_ATCH_FILE, TN_HNF, TN_CSTS_INSTT, TN_CSTS_OPERTN, TN_CSTS_WRTER, TN_INSTT_CRTFC |
| ChangeReqst.xml | selectMngrList, selectInspctList, insertChangeReqst, updateChangeReqst, selectChangeReqst, deleteChangeReqst, selectTnHnf, selectThHnf, insertThHnf, updateThHnf, deleteThHnf, upsertGeneInspctCo, insertChgHnf, deleteChgHnf, selectThHnfList, insertCstsInstt, selectCstsInstt, updateCstsInstt, insertCtgryMapping, changeCstsWrter, selectThCstsWrter, selectLastChangeReqst, selectThWrter, selectTnWrter, updateChaThWrter, selectThCstsInst, selectTnCstsInst, updateChaCstsInstt, selectCstsInspct | TN_CSTS, TN_CSTS_INSTT, TN_CHANGE_REQST, TH_HNF, TH_CSTS_INSTT, TH_CSTS_WRTER, TN_CHANGE_CTGRY_MAPNG |

### SQL Mapper (cte)
| 파일 | 테이블 |
|------|--------|
| CstsCell.xml | TN_CELL, TN_CMMN_DETAIL_CODE, TN_CELL_CODE |
| CstsDisspd.xml | TN_DISSPD, TN_CMMN_DETAIL_CODE |
| CstsDpSnp.xml | TN_DISSPD_SNP |
| CstsDpSnpEtc.xml | TN_DISSPD_SNP_ETC |
| CstsDpRelm.xml | TN_DISSPD_RELM |
| CstsNliem.xml | TN_NLIEM, TN_CMMN_DETAIL_CODE |
| CstsNiSnp.xml | TN_NLIEM_SNP |
| CstsNiSnpEtc.xml | TN_NLIEM_SNP_ETC |
| CstsNiRelm.xml | TN_NLIEM_RELM |
| CstsIdrch.xml | TN_IDRCH |
| CstsEmbfet.xml | TN_EMBFET |
| CstsMdtch.xml | TN_MDTCH |
| CstsNgs.xml | TN_NGS, TN_NGS_CODE |
| CstsNmrtr.xml | TN_NMRTR, TN_NMRTR_CODE |

---

## 5. DVL 모듈

### VO 클래스
| 클래스 | 서브모듈 | 주요 필드 |
|--------|---------|-----------|
| TnTrgtSlctnVO | trgt | trgtSlctnId, inspctId, docEvlAt, docUnselResnCd, sptEvlAt, sptUnselResnCd, extrlAt, extrlUnselResnCd, extrlComment, registId, registDt, updtId, updtDt, cstsYear, insttSeCd, insttNm, inspctNm, inspctClCd, cstsId |
| TnBfdocEvlVO | bfat | cstsId, judgId, evlComptAt, evlComptDt, registId, registDt, updtId, updtDt, inspctId, cstsYear, inspctNm, judgNm, psitnKwa, insttNm, insttSeCd, qesId, score, totalScore, rm, qesAnswer, mngrId, mngrNm, upperQesId, qesNo, qesTn, seq, answer, level, inputMthdCd, rootQesNo |
| TnNliemExcelVO | bfat | 97개 필드 (전체 NLIEM 데이터 Excel 출력용) |
| PertVO | pert | cstsId, inspctId, trgtSlctnId, insttNm, inspctNm, insttSeCd, insttSeNm, nliemCnt, disspdCnt, totalCnt, judgNm, judgId, psitn, psitnKwa, cstsYear, evlComptAt, nliemEvlYn, disspdEvlYn, type |
| PertDisspdVO | pert | 206개 필드 (질환예측 전문가평가 전체 데이터) |
| PertNliemVO | pert | 263개 필드 (기타항목 전문가평가 전체 데이터) |
| ObjcVO | objc | objcId, objcPdId, objcDt, objcCn, objcAnswer, registId, registDt, updtDt, updtId, objcSttusCd, objcSttusCdNm, objcFileId, atchFileId, answerFileId, inspctId, objcCd, objcCdNm, inspctNm, insttNm, insttSeCdNm, cstsYear, deleteAnswerFileId, deleteAnswerFileSeq, deleteObjcFileId, deleteObjcFileSeq, deleteAtchFileId |
| TnClgnVO | clgn | inspctId, inspctNm, insttNm, judgId, cstsYear, insttSeCd, judgNm, asignCnt, totalCnt, psitn, psitnKwa, dvlBeginDt, type, clgnAt, clgnResn, evlComptAt, rm1, rm2, rm3, cstsId, clgnCteCd, clgnCteCdNm, nmrtrId, ngsId, cellId, embfetId, mdtchId, nliemId, nliemRelmId, disspdId, disspdRelmId, idrchId, eachId, reAsign, nliemSe, nmrtrCnt, ngsCnt, cmaCnt, cellCnt, embfetCnt, mdtchCnt, nliemCnt, disspdCnt, idrchCnt, nmrtrEvlYn, ngsEvlYn, cellEvlYn, embfetEvlYn, mdtchEvlYn, nliemEvlYn, disspdEvlYn, idrchEvlYn, cmaEvlYn, inspctSvcNm, clinCnt, clgnCnt, idrchAt |

### SQL Mapper
| 파일 | 주요 Statement IDs | 주요 테이블 |
|------|-------------------|------------|
| Trgt.xml | selectTrgtList, selectTrgtCnt, updateTrgt, mergeTrgt, selectEvlPosbl | TN_TRGT_SLCTN, TN_INSPCT, TN_INSTT, TN_CMMN_DETAIL_CODE, TN_CSTS |
| bfat.xml | selectInspctList, selectJudgList, insertBfdocEvl, deleteBfdocEvl, selectBfdocQesList, selectBfdocList, selectBfdocScoreList, deleteBfdocEvlScore, insertBfdocEvlScore, deleteBfdocEvlScoreMngr, insertBfdocEvlScoreMngr, updateBfdocEvlCompt, selectBfdocAllList, selectBfdocScoreMngrList, selectExcelNliem, selectExcelDisspd, selectBfdocResultList/Cnt, selectBfdocScoreRsltList | TN_CSTS, TN_INSPCT, TN_INSTT, TN_BFDOC_EVL, TN_BFDOC_EVL_SCORE, TN_BFDOC_EVL_SCORE_MNGR, TN_QES, TN_JUDG, TN_TRGT_SLCTN, TN_NLIEM, TN_NLIEM_RELM, TN_NLIEM_SNP, TN_NLIEM_SNP_ETC, TN_PERT_NLIEM, TN_DISSPD, TN_DISSPD_RELM, TN_DISSPD_SNP, TN_DISSPD_SNP_ETC, TN_PERT_DISSPD |
| Pert.xml | selectPertList/Cnt, selectPertAsignList, selectAsignNliemList, insertAsignNliem, updateAsignNliem, selectAsignDisspdList, insertAsignDisspd, updateAsignDisspd, selectJudgList, selectPertNliemList | TN_CSTS, TN_TRGT_SLCTN, TN_INSPCT, TN_INSTT, TN_PERT_NLIEM, TN_PERT_DISSPD, TN_NLIEM, TN_NLIEM_RELM, TN_DISSPD, TN_DISSPD_RELM, TN_JUDG, TN_MORALS_DISS, TN_PRHIBT_GENE |
| Objc.xml | selectList, count, insertObjc, updateObjc, isCheckObjc, selectDetail | TN_OBJC, TN_OBJC_PD, TN_INSPCT, TN_INSTT, TN_CMMN_DETAIL_CODE |
| Clgn.xml | selectClgnList, selectClgnCnt, selectAgreAt, selectAsignList, selectJudgList, selectAsignNmrtr, selectAsignNgs, selectAsignCell, selectAsignEmbfet, selectAsignMdtch | TN_INSPCT, TN_CSTS, TN_TRGT_SLCTN, TN_INSTT, TN_CMMN_DETAIL_CODE, TN_CLGN_NMRTR, TN_CLGN_NGS, TN_CLGN_CELL, TN_CLGN_EMBFET, TN_CLGN_MDTCH, TN_CLGN_NLIEM, TN_CLGN_DISSPD, TN_CLGN_IDRCH, TN_JUDG, TN_JUDG_AGRE, TN_NMRTR, TN_NGS, TN_CELL, TN_EMBFET, TN_MDTCH, TN_NLIEM_RELM, TN_DISSPD_RELM, TN_IDRCH |

---

## 6. EDM 모듈 (숙련도평가)

### VO 클래스
| 클래스 | 서브모듈 | 주요 필드 |
|--------|---------|-----------|
| EvlVO | evl | edmTrgtId, inspctId, ptmId, evlNm, ptmYear, ptmNo, edmSttusCd, edmSttusNm, rsltAt, recptNm, recptDt, nsceEmtAt, dventNm, presentnAt, presentnNm, presentnRspofc, presentnTelno, registId, registDt, updtId, updtDt, edmCtgryCd, edmCtgryCdNm, edmCtgryNm, comptAt, geneId, geneNm, ptmPd, edmRsltTyCd, istSnvGeneNm, istSnvGeneRs, genecdChroLc, genesnvGenoLc, genesnvAeRef, genesnvAeAlt, edmAtchFileId, edmAtchFileNm, cstsYear, insttNo, insttNm, insttSeCd, insttSeCdNm, adres, inspctNm, orgGeneId, dscssAllYn |
| IdrchVO | evl | edmLocusCd, edmLocusNm, qesVal, mttrId, mttrNm, geneId, edmTrgtId, edmCtgryCd, ptmId, ale1, ale2, pi, edmStrTyCd, edmStrTyNm, edmStrGroupCd, edmStrGroupNm, preCnsrAle1, preCnsrAle2, preAleComment, prePiComment, preAleGradCd, prePiGradCd, preCnclsnGradCd, preCnsrCnclsn, preAnswerComment, preCnsrCalc, preCaseGradCd, lastCnsrAle1, lastCnsrAle2, lastAleGradCd, lastPiGradCd, lastCnclsnGradCd, lastCnsrCnclsn, lastAnswerComment, lastCnsrCalc, lastCaseGradCd, cnt, mean, sd, median, minCo, maxCo, edmCnsrSe |
| GeneVO | evl | edmTrgtId, ptmId, edmCtgryCd, edmCtgryNm, edmItemCd, edmRsltTyCd, geneNm, edmAtchFileId |
| MttrRceptVO | evl | edmTrgtId, trgtSlctnId, inspctId, ptmId, ptmNm, geneId, edmSttusCd, nsceEmtAt, dventNm, presentnAt, presentNm, presentnEmail, presentnTelno, extrlAt, extrlUnselResnCd, extrlComment, cstsYear, insttNo, insttNm, inspctNm, insttSeCd, inspctPurps, hnfSeCd, hnfNm, mobileNo, email, nmrngsRecptNo, cellRecptNo, nliemRecptNo, disspdRecptNo, idrchRecptNo |
| NiptVO | evl | edmTrgtId, ptmId, geneId, mttrId, edmNiptId, inspctId, inspctNm, insttNm, insttSeNm, chroLc, edmNiptRiskCd, edmNiptRiskNm, preAnswerRiskCd, preAnswerGradCd, preAnswerComment, answerRiskCd, answerGradCd, answerComment, edmCnsrSe |
| NliemVO | evl | edmTrgtId, inspctId, ptmId, geneId, geneNm, rsNo, chroLc, genoLc, aeRef, aeAlt, edmCtgryCd, inspctMth, ale1, ale2, mttrId, mttrNm, resultAtchFileId, auth, edmNliemId, edmDisspdId, answerAeRef, answerAeAlt, answerAle1, answerAle2, answerGradCd, answerComment, preAnswerAeRef, preAnswerAeAlt, preAnswerAle1, preAnswerAle2, preAnswerGradCd, preAnswerComment |
| QesVO | evl | qesId, geneId, lclasId, ptmId, mttrId, mttrNm, qesNm, upperQesId, edmInputTyCd, etcAt, depth, ordr, edmRsltTyCd, cnsrMtchgAt, edmImgFileId, qesVal, inputFileId, inputFileNm, edmTrgtId, edmAtchFileId, qesEtc, edmCtgryCd, edmCnsrSe |
| SchdulVO | evl | edmTrgtId, ptmId, ptmYear, ptmNo, ctgry001~007, preRslt, othbcYn, lastRsltDt, othbcBeginDt, othbcEndDt, preRsltBeginDt, preRsltEndDt, inspctId |
| ResultVO | result | edmTrgtId, inspctId, inspctNm, insttNm, insttSeCd, geneId, geneNm, ptmId, edmCtgryCd, qesId, mttrId, mttrNm, inspctMth, inspctTrget, inspctResult, qesCnsr, qesNm, preGradCd, preGradNm, preComment, lastGradCd, lastGradNm, lastComment, answer, input, inputSelect, inputText, qesPath, result, aResult~iResult, preMcnCd, preScdCd, preRoaCd, preKnCd, lastMcnCd~lastKnCd, cnt, ordr, variantNm, groupId, edmCnsrSe, ngsGardId, ngsGeneNm |
| EdmObjcVO | objc | edmObjcId, objcPdId, objcDt, objcCn, objcAnswer, objcSttusCd, objcFileId, atchFileId, answerFileId, inspctId, objcCd, inspctNm, insttNm, cstsYear |
| TnEdmPtmVO | term | ptmId, ptmYear, ptmNo, othbcBeginDt, preRsltBeginDt, preRsltEndDt, lastRsltDt, ptmSttusCd, registId, registDt, updtId, updtDt, edmCtgryCd, ptmBeginDt, ptmEndDt, email, inspctId, objcEndDt, edmTrgtId |
| CrtfctVO | crtfct | ptmYear, edmCtgryCd, edmItemCd, geneNm, geneId, ptmId, ptmNo, edmTrgtId, score, inspctId, insttNm, inspctNm, insttSeNm, cstsId, sptEvlAt, sptUnselResn, extrlAt, lclasId, sptScore, sptGrade, judgId, judgNm |
| StatVO | stat | ptmId, edmCtgryCd, edmItemCd, edmTrgtId, inspctId, insttNm, insttSeCd, gradCd001~007, gradTotal, totalScore, geneId, geneNm, ngsGeneNm, mttrId, mttrNm, lastGradCd, lastGradCdNm, inspctMth, medCo, nonMedCo, totalCo, score70, score7080, score8090, score90100 등 |
| TnEdmIdrchStrRsltCnsrVO | sys | edmStrTyCd, mttrId, mttrNm, edmStrGroupCd, ptmId, preCnsrAle1, preCnsrAle2, lastCnsrAle1, lastCnsrAle2, edmCtgryCd, edmCnsrSe, preCnsrCnclsn, lastCnsrCnclsn, edmLocusCd |
| TnEdmNiptIemVO | sys | edmNiptId, edmTrgtId, ptmId, ptmNo, geneId, mttrId, chroLc, edmNiptRiskCd, preAnswerRiskCd, preAnswerGradCd, preAnswerComment, answerRiskCd, answerGradCd, answerComment, registId, updtId, edmCtgryCd, edmCnsrSe, inspctId |
| TnEdmQesInputVO | sys | edmTrgtId, ptmId, geneId, qesId, qesVal, inspctId, insttNm, insttSeCdNm, inputCo |
| TnEdmGeneVO | sys | geneId, ptmId, edmCtgryCd, edmItemCd, edmRsltTyCd, geneNm, ordr, edmAtchFileId, qesYn, registId, updtId, mttrId, mttrNm, mttrCo, orgPtmId, atchEssntlAt, atchMttrId, lclasId, rsltAt, onlyAtchAt, edmTrgtId |
| TnEdmNliemIemVO | sys | edmNliemId, edmDisspdId, edmTrgtId, ptmId, geneNm, rsNo, chroLc, genoLc, inspctMth, mttrId, aeRef, aeAlt, ale1, ale2, preAnswerAeRef, preAnswerAeAlt, preAnswerAle1, preAnswerAle2, preAnswerGradCd, answerAeRef, answerAeAlt, answerAle1, answerAle2, edmCtgryCd, edmCnsrSe |
| TnEdmQesVO | sys | qesId, geneId, lclasId, ptmId, mttrId, qesNm, upperQesId, edmInputTyCd, etcAt, depth, ordr, cnsrMtchgAt, edmRsltTyCd, edmImgFileId, deleteAt, edmCtgryCd, edmCnsrSe, qesValCo, qesVal |
| TnEdmTrgtVO | sys | edmTrgtId, inspctId, inspctNm, insttNm, insttSeCdNm, ptmId, edmCtgryCd, isSerial |
| TnEdmQesCnsrVO | sys | ptmId, geneId, mttrId, qesId, upperQesId, edmCnsrSe, edmInputTyCd, qesCnsr, registId, qesValCo |
| ReportVO (edm/rpt) | rpt | ptmId, edmItemCd, insttSeCd, mttrId, edmStrGroupCd, qesNm, depth, qesCo, lclasId, edmImgFileId, qesId, upperQesId, mean, sd, median, minCo, maxCo, lastCnsrCalc, edmLocusCdNm, edmTrgtId, score, geneId, geneNm, edmRsltTyCd, qesPath, qesCnsr, lastGradCd, lastGradCdNm, lastGradCdCo, ngsGeneNm 등 |
| TnEdmGeneVO (rpt) | rpt | geneId, ptmId, edmCtgryCd, edmItemCd, edmRsltTyCd, geneNm |

### SQL Mapper
| 파일 | 주요 Statement IDs | 주요 테이블 |
|------|-------------------|------------|
| Evl.xml | selectInspctSchdulList, selectGeneList, selectCtgryList, selectPtmList, selectEvlGeneList, selectNliemMttrList, selectDisspdMttrList, selectNliemIemList, selectDisspdIemList, selectQesList, selectEdmInspctList, selectEdmTrgtId, selectMttrListByEdmCtgryCd, selectIdrchCaseList, selectCnclsnList, selectIdrchStrResultList, selectIdrchStrPiResultList, selectEdmPresentnAt, selectPtmPd, selectIsCompList, selectCtgryGeneList, selectNiptIemList, insertNliemReport/DisspdReport, insertEdmQesInput, insertIdrchStr/Cnclsn/Case, insertPresentn, updateNliemIem, updateDisspdIem, updateEdmDscssAt, updateComptAt, updateNiptIem, deleteNliemReport/DisspdReport, deleteEdmQesInput, deleteIdrchStr/Cnclsn/Case | TN_EDM_TRGT, TN_EDM_PTM, TN_EDM_PTM_CTGRY, TN_EDM_GENE, TN_EDM_GENE_MAPNG, TN_EDM_MTTR, TN_EDM_MTTR_MAPNG, TN_EDM_NLIEM_REPORT, TN_EDM_DISSPD_REPORT, TN_EDM_NLIEM_IEM, TN_EDM_DISSPD_IEM, TN_EDM_ATCH_FILE, TN_EDM_QES, TN_EDM_QES_INPUT, TN_INSPCT, TN_INSTT, TN_CSTS, TN_TRGT_SLCTN, TN_NMRTR, TN_CSTS_OPERTN, TN_EDM_CTGRY_MAPNG, TN_EDM_IDRCH_CASE, TN_EDM_IDRCH_CASE_CNSR, TN_EDM_IDRCH_CNCLSN, TN_EDM_IDRCH_CNCLSN_CNSR, TN_EDM_IDRCH_STR_RESULT, TN_EDM_IDRCH_STR_RESULT_CNSR, TN_EDM_PRESENTN, TN_EDM_NIPT_IEM |
| MttrRcept.xml | selectEdmMttrRceptList, selectEdmMttrHnfList, selectMttrRceptNoList, updateTrgtMttrRcept | TN_EDM_TRGT, TN_INSPCT, TN_INSTT, TN_EDM_GENE_MAPNG, TN_CMMN_DETAIL_CODE, TN_CSTS, TN_HNF, TN_EDM_CTGRY_MAPNG |
| Result.xml | selectTypeAList, selectMttrList, selectTypeAContentList, selectIsExistsGrad, selectType005InspctList, selectTypeAListForGrdng, selectTypeBHeader, selectTypeBContentList, selectTypeBNoVariantContentList, selectTypeCContentList, selectType004InspctList, selectTypeDInspctList, selectTypeDContentList, selectTypeDListForGrdng, selectTypeFHeader, selectTypeFContentList, selectTypeGList, selectTypeGContentList, selectTypeHContentList, selectTypeLContentList, selectMttrResultTypeA/D/HList, selectType007InspctList, insertQesGrad, insertQesNgsGrad, insertKaryoPreGrad, updateQesGrad, updateQesPreGrad, updateQesLastGrad, updateNiptIem, updateKaryoPreGrad, updateKaryoLastGrad, updateKaryoGrad, updateQesNgsPreGrad, updateQesNgsLastGrad, updateNgsGrad, updateIdrchStrResult, updateIdrchCnclsn, updateIdrchCase | TN_EDM_TRGT, TN_EDM_QES_RSLT, TN_EDM_QES, TN_EDM_MTTR_MAPNG, TN_EDM_MTTR, TN_EDM_GENE_MAPNG, TN_EDM_GENE, TN_INSPCT, TN_INSTT, TN_EDM_NIPT_IEM, TN_EDM_KARYOTYPE_RSLT, TN_EDM_KARYOTYPE_CONSR, TN_EDM_NGS_RSLT, TN_EDM_IDRCH_STR_RESULT, TN_EDM_IDRCH_CNCLSN, TN_EDM_IDRCH_CASE |
| EdmObjc.xml | selectList, count, insertObjc, updateObjc, isCheckObjc, selectDetail | TN_EDM_OBJC, TN_EDM_ATCH_FILE |
| EdmTerm.xml | selectPtmTermList, selectPtmList, selectPtmCtgryList, selectPtmDtlList, selectMsgTrgtInspct, insertPtm, insertPtmCtgry, updatePtm, updatePtmCtgry, deletePtm, deletePtmCtgry | TN_EDM_PTM, TN_EDM_PTM_CTGRY, TN_EDM_TRGT, TN_INSPCT, TN_INSTT |
| Crtfct.xml | selectGeneList, selectPtmList, selectInspctList, selectContentList, selectSptContentList | TN_EDM_GENE, TN_EDM_GENE_MAPNG, TN_EDM_MTTR, TN_EDM_MTTR_MAPNG, TN_EDM_ATCH_FILE, TN_EDM_CRTFCT, TN_EDM_CRTFCT_MAPNG, TN_INSPCT, TN_INSTT |
| EdmStat.xml | selectStatCtgryList, selectStatInspctScoreList, selectStatInspctKaryoScoreList, selectStatInspctNgsScoreList, selectStatGeneMttrList, selectStatInspctList, selectStatInspctGradList, selectStatInspctKaryoGradList, selectStatNgsGeneMttrList, selectStatNgsInspctGradList, selectStatInspctNliemScoreList, selectStatInspctDisspdScoreList, selectStatInspctNiptScoreList, selectStatItemList, selectStatScoreSctnList, selectStatInspctEvlScoreList, selectStatInspctIdrchCaseList, selectStatInspctIdrchScoreList | TN_EDM_GENE, TN_EDM_GENE_MAPNG, TN_EDM_QES_RSLT, TN_EDM_IDRCH_STR_RESULT, TN_EDM_NLIEM_IEM, TN_EDM_DISSPD_IEM, TN_EDM_NIPT_IEM, TN_EDM_TRGT, TN_INSPCT, TN_INSTT, TN_EDM_QES, TN_EDM_MTTR, TN_EDM_IDRCH_CASE, TN_EDM_KARYOTYPE_RSLT, TN_EDM_NGS_RSLT |
| EdmSys.xml | selectGeneList, selectMttrList, selectCtgryRsltMapng, selectEdmLclas, selectGeneRsltTy, selectQesImgFile, selectCtgryGeneList, selectQesCnsr, selectQesInputCoList, selectQesSubtiveCoList, selectInspctInputList, selectInspctTrgtCstsList, selectNliemList, selectDisspdList, selectNliemIemList, selectDisspdIemList, selectSerialCo, selectIdrchStr/Cnclsn/CaseCntr, selectNiptList, selectNiptIemList, selectQesList, insertGene, insertMttr, insertMttrMapng, insertQes, insertQesCnsr, insertNliemIem, insertDisspdIem, insertIdrchStr/Cnclsn/CaseCntr, insertNiptIem, updateGene, updateMttr, updateQes, updateQesOrdrAll, updateNliemIem, updateDisspdIem, updateIdrchStr/Cnclsn/CaseCntr, updateNiptIem, deleteGene, deleteMttr, deleteMttrMapng, deleteQes, deleteQesAll, deleteQesCnsr, deleteIdrchStr/Cnclsn/CaseCntr | TN_EDM_GENE, TN_EDM_GENE_MAPNG, TN_EDM_MTTR, TN_EDM_MTTR_MAPNG, TN_EDM_QES, TN_EDM_LCLAS, TN_EDM_QES_CNSR, TN_EDM_QES_INPUT, TN_EDM_TRGT, TN_CSTS, TN_EDM_NLIEM_IEM, TN_EDM_DISSPD_IEM, TN_EDM_IDRCH_STR_RESULT, TN_EDM_IDRCH_STR_RESULT_CNSR, TN_EDM_IDRCH_CNCLSN, TN_EDM_IDRCH_CNCLSN_CNSR, TN_EDM_IDRCH_CASE, TN_EDM_IDRCH_CASE_CNSR, TN_EDM_NIPT_IEM |
| EdmRpt.xml | selectRptCtgryList, selectRptTrgtList, selectMttrIdrchList, selectInspctMthList, selectCaseIdrchList, selectMttrList, selectRptDissList, selectRptNliemList, selectRptNmrtrList/TrgtTotalList/TrgtList/MthList/RsltList/CnsrList/GradList/CnsrBtypeList/VariantBtypeList/RsltBtypeList, selectRptNgsList/CnsrList/GradList/PctList/RsltList, selectRptCaseHisList, selectRptKaryoCnsrList/GradList, selectRptGeneList, selectRptComment/NgsComment, selectRptCmaCnsrList/RsltList, selectRptFishList/CnsrList/RsltList/GradList, selectRptNiptList, insertRptComment/NgsComment, updateRptComment/NgsComment | TN_EDM_GENE, TN_EDM_TRGT, TN_EDM_IDRCH_STR_RESULT, TN_EDM_IDRCH_CASE, TN_EDM_IDRCH_CNCLSN, TN_EDM_MTTR, TN_EDM_NLIEM_IEM, TN_EDM_DISSPD_IEM, TN_EDM_QES_RSLT, TN_EDM_QES, TN_NMRTR, TN_EDM_KARYOTYPE_RSLT, TN_EDM_NGS_RSLT, TN_EDM_NIPT_IEM, TN_EDM_ATCH_FILE, TN_EDM_RPT_COMMENT, TN_INSPCT |
| EdmTrgt.xml | selectEdmTrgtList, selectHnfList, selectGeneTrgtList, selectRcptTrgtList, insertEdmTrgt, insertEdmCtgryMapng, insertEdmGeneMapng, updateEdmTrgt, deleteEdmTrgt, deleteEdmCtgryMapng, deleteEdmGeneMapng | TN_EDM_TRGT, TN_CSTS, TN_INSPCT, TN_INSTT, TN_HNF, TN_EDM_CTGRY_MAPNG, TN_EDM_GENE_MAPNG |

---

## 7. SPT 모듈 (방문심사)

### VO 클래스
| 클래스 | 서브모듈 | 주요 필드 |
|--------|---------|-----------|
| SptClVO | sys | sptClId, upperSetClId, sptClNm, depth, ordr, useAt, registId, registDt, updtId, updtDt, judgId, sptTrgtId, qesCnt, answerYn, sptQesYear, sptInsttSeCd |
| SptQesVO | sys | sptQesId, sptQesYear, upperSptQesId, sptClId, ordr, lclasId, mclasId, sclasId, ctgryCd, ctgryCdNm, ctgryDetailCd, ctgryDetailCdNm, sptInsttSeCd, sptQesNo, sptQesTn, sptQesAnswerCd, essntlAt, sptQesScore, dtlQesAt, depth, smrQesAt, sptQesDc, useAt |
| SchdulVO | schdul | judgId, judgNm, judgEvlYear, sptJudgYearNo, areaCd, judgEvlMm, psitn, psitnKwa, mobileNo, acqsYear, leadrAt, email, sptTrgtId, evlMonth, sptReqstSttusCd, evlDay, evlYear, audtDt, audtPam, lclasId, lclasNm, inspctId, dscssAt, asignDcsnAt, insttNm, insttSeNm, asignCancelSe, inspctNm, adres, audtSttusCd, eduYn, trgtYear, ctgry0~5 |
| InspctVO | schdul | cstsId, inspctId, clNo, frstSttemntDt, changeSttemntDt, insttNm, inspctNm, insttCxfc, insttSeCd, insttSeNm, zip, adres, insttAdres, detailAdres, inspctAdres, insttNo, telno |
| TnSptTrgtVO | trgt | sptTrgtId, inspctId, trgtYear, audtDt, audtPam, audtSttusCd, audtSeCd, rm, audtDcsnAt, asignDcsnAt, dscssAt, registId, registDt, updtId, updtDt, sptAtchFileId, lclasId, insttNm, inspctNm, trgtSlctnId |
| EvlVO (spt) | evl | sptTrgtId, inspctId, trgtYear, audtDt, audtPam, audtSttusCd, audtSeCd, sptAtchFileId, sptClId, insttNm, inspctNm, ctgry0~5 EvlYn, judgId, judgNm, audtDtNm, insttSeCd, acqsYear, judgPosblAt, sptReqstSttusCd, leadrAt, mobileNo, confmSe, lclasId, eduYn, preResultBeginDt, preResultEndDt, lastRecptDt, lastRecptNm, lastRecptRspofc, lastRecptTelno, leadrJudgId |
| TnSptJdgmnVO | evl | sptTrgtId, judgId, judgNm, leadrAt, lclasId, lclasNm, sptQesScore, sptScore, totSptQesScore, totSptScore, trgtYear, thtsTn, comment, inspctId, audtSttusCd, lastRecptDt, lastRecptNm, lastRecptRspofc, lastRecptTelno |
| TnSptRciptVO | rcipt | judgId, judgNm, psitn, psitnLrstyCdNm, rciptYear, evlExp, trfExp, eatExp, bankNm, bankAcnut, ihFirst, ihLast, sptAtchFileId, sptRciptAtchFileId, mngrDnloadAt, rciptSign, audtDtCo, sptCo, signAt, audtDt, audtPam, isEat, inspctId, insttNm, inspctNm, bassEvlExp, bassTrfExp, bassEatExp, rciptJudgIds |
| SptObjcVO | objc | sptObjcId, objcPdId, objcDt, objcCn, objcAnswer, objcSttusCd, objcFileId, atchFileId, answerFileId, inspctId, objcCd, inspctNm, insttNm, cstsYear |
| TnSptJudgVO | thts | sptTrgtId, judgId, judgNm, leadrAt, lclasId, confmAt, presentnAt, thtsId, thtsNo, thtsTn, thtsSeCd, thtsYear, comment, insttNm, inspctId, inspctNm, audtDt, audtPam, sptClNm, qesEprssSe, sptQesNo, sptQesTn, sptAnswer, sptQesScore, sptScore, lvlPath |
| TnSptThtsVO | thts | thtsId, thtsYear, thtsSeCd, thtsSeCdNm, thtsNo, thtsTn, thtsDc, bassComment, reportAt, qesEprssSe, useAt |
| TnSptJudgEduVO | term | judgId, judgNm, eduYear, eduDt, eduAt, psitn, psitnLrstyCdNm, registId, registDt, updtId, updtDt |
| TnSptTrgtVO (term) | term | sptTrgtId, inspctId, trgtYear, audtSttusCd, lclasId |
| ReportVO (spt) | report | sptTrgtId, inspctId, inspctNm, insttNm, insttSeCd, insttSeNm, inspctDNm, adres, lclasNm, audtDt, judgNm, trgtYear, thtsSecd, thtsNo, lclasId, comment |

### SQL Mapper
| 파일 | 주요 Statement IDs | 주요 테이블 |
|------|-------------------|------------|
| Sys.xml | selectCtgryList(RECURSIVE), selectCtgryDepth1/2/3List, selectNextCtgryId, insertCtgry, updateCtgry, deleteCtgry/Children, deleteQesByCtgry, selectQesList, checkDupSptQesNo, updateQes, insertQes, selectQesFullList(RECURSIVE), deleteQes, selectLastQesYear, selectLastQes, deleteQesBySptQesYear | TN_SPT_CL, TN_SPT_QES, TN_CMMN_DETAIL_CODE |
| Schdul.xml | selectCstsInspctInfo, selectJudgArea, insertSptJudgYear, selectSptJudgYearNo, insertSptJudgArea/Mm, deleteSptJudgArea/Mm, selectSptJudgList, selectSptSchdulList, selectSptJudgListForAsign, selectInspctSchdulInfo, insertSptInspctEvlym, deleteSptInspctEvlym, deleteSptJdgmn, selectSchdulListForInspct, selectInspctEvldayInfo, insertSptInspctEvlday, deleteSptInspctEvlday, updateSptReqstSttusCd, insertSptJudg, deleteSptJudg, updateSptJudg, checkAvailableDate, updateSptTrgt, selectSchdulSttusInfo, selectJudgHist | TN_CSTS_INSTT, TN_INSPCT, TN_SPT_JUDG_YEAR, TN_SPT_JUDG_AREA, TN_SPT_JUDG_MM, TN_SPT_CTRGY_MAPNG, TN_SPT_JUDG, TN_JUDG, TN_SPT_JUDG_EDU, TN_SPT_TRGT, TN_SPT_INSPCT_EVLYM, TN_INSTT, TN_SPT_INSPCT_EVLDAY |
| SptTrgt.xml | selectSptTrgtList, insertSptTrgt, updateSptTrgt, deleteSptTrgt, insertSptCtrgyMapng, deleteSptCtrgyMapng, selectCstsOpertn | TN_CSTS, TN_TRGT_SLCTN, TN_SPT_TRGT, TN_INSPCT, TN_INSTT, TN_SPT_CTRGY_MAPNG, TN_CSTS_OPERTN |
| Evl.xml (spt) | selectLastSptTrgtId, selectInspctEvlList (and more) | TN_SPT_TRGT, TN_INSPCT, TN_INSTT, TN_SPT_CTRGY_MAPNG |
| ClgnResult.xml | selectNmrtrList, selectNgsList (and more) | TN_NMRTR, TH_NMRTR, TN_CLGN_NMRTR, TN_CHANGE_CTGRY_MAPNG, TN_CHANGE_REQST |
| SptRcipt.xml | selectSptJudgRciptList, selectSptRciptList | TN_JUDG, TN_SPT_JUDG, TN_SPT_TRGT, TN_SPT_RCIPT |
| SptObjc.xml | selectList, count, insertObjc, updateObjc, isCheckObjc | TN_SPT_OBJC, TN_OBJC_PD, TN_INSPCT, TN_INSTT |
| Thts.xml | selectThtsList, insertThts, updateThts, deleteThts, deleteLastThts, selectSptJudg, selectJudgReportList, insertSptJudgReport, deleteSptJudgReport | TN_SPT_THTS, TN_SPT_TRGT, TN_INSPCT, TN_INSTT, TN_SPT_JUDG, TN_JUDG, TN_SPT_CL, TN_SPT_JUDG_REPORT |
| SptTerm.xml | selectEduList, insertEdu, updateEdu, selectResultList, updateResult | TN_JUDG, TN_SPT_JUDG_EDU, TN_SPT_TRGT, TN_INSPCT, TN_INSTT |
| Report.xml | selectInspctList, selectContentList | TN_SPT_TRGT, TN_INSPCT, TN_INSTT, TN_SPT_CTRGY_MAPNG, TN_SPT_JUDG, TN_JUDG, TN_SPT_THTS, TN_SPT_JUDG_REPORT, TN_SPT_INSPCT_REPORT |

---

## 8. STAT 모듈

### VO 클래스
| 클래스 | 주요 필드 |
|--------|-----------|
| SptStatVO | sptQesId, upperSptQesId, sptQesNo, upperQesNo, depth, dtlQesAt, ordr, sptTrgtId, sptAnswer, sptScore, inspctId, inspctNm, insttNm, lclasId, lclasNm, mclasId, mclasNm, sclasId, sclasNm, ctgryCd, ctgryNm, essntlAt, sptQesScore, sptInsttSeCd, sptQesYear, totalScore, noneScore, dmrtrScore |

### SQL Mapper
| 파일 | 주요 Statement IDs | 주요 테이블 |
|------|-------------------|------------|
| SptStat.xml | selectSptQesList(RECURSIVE), selectSptQesContentList, selectInspctList | TN_SPT_QES, TN_SPT_CL, TN_CMMN_DETAIL_CODE, TN_SPT_CTRGY_MAPNG, TN_SPT_JDGMN, TN_SPT_TRGT, TN_INSPCT, TN_INSTT |

---

## 핵심 패턴 요약

### GridVO 상속 패턴
대부분의 도메인 VO는 GridVO를 상속받아 페이징/정렬/필터링 기능을 내장함

### 공통 코드 조회 패턴
거의 모든 SQL에서 `TN_CMMN_DETAIL_CODE`를 JOIN하여 코드명 조회

### 변경요청(ChangeReqst) 패턴
- TN_CHANGE_REQST + TH_*(이력테이블)로 변경내역 추적
- changeReqstId, changeSttusCd 필드가 많은 VO에 포함됨

### EDM 평가유형 (edmRsltTyCd)
- A: 분자유전 (Nmrtr) - QES 기반
- B: NGS
- C: 핵형분석 (Karyotype)
- D: FISH/CMA 등
- H: NIPT

### SPT 심사체계
- TN_SPT_CL (분류) → TN_SPT_QES (문항) → TN_SPT_JDGMN (심사결과)
- TN_SPT_TRGT (심사대상) → TN_SPT_JUDG (심사원배정) → TN_SPT_JUDG_REPORT
