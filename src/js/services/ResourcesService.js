angular.module('app.services')

.factory('ResourcesService', function(ServerUrls, AppMeta, UserService, BaseResourcesService, TemplateService, SecurityService) {

  function getDobFromNRIC(nric) {
    var _nric = nric.slice(0, 6);
    var nricYear = nric.slice(0, 2);
    var thisYear = moment().format('YY');
    var data = 20;
    if (_.parseInt(thisYear) <= _.parseInt(nricYear))
      data = 19;
    return data + _nric;
  }

  function getReqHeader() {
    var now = moment();
    return {
      trxnRefNo: AppMeta.appRefNo + now.format('DDMMYYYY') + (Math.floor(SecurityService.getRandomNumber() * (10000000 - 13 + 1) + moment().unix().toString(7)) + moment().unix().toString(16)), // last part has 15 char length.
      channel: AppMeta.appRefNo,
      reqDateTime: now.format('DDMMYYYYHHmmss'),
    };
  }

  function buildReqObj() {
    return {
      reqHeader: getReqHeader(),
      reqBody: {},
    };
  }

  function iServeNRIC(nric) {
    return nric.slice(0, 6) + '-' + nric.slice(6, 8) + '-' + nric.slice(8);
  }

  function buildSubmissionData(data, form) {
    var userInfo = UserService.user.user();
    var ereferenceNoPrefix = 'C-';
    // check the form & add tempalte info...
    if (data.info && data.info.sourceSystem) {
      data.info.companyCode = data.info.sourceSystem.toUpperCase() === 'LAFT' ? '072' : '016';
    }

    var returnObj = {
      code: userInfo.userId,
      language: UserService.language.get(),
      submissionDate: moment().format('YYYY-MM-DD HH:mm:ss.SSS'),
      staffName: userInfo.username,
      branchName: userInfo.branchName,
      signature: '',
      ereferenceNo: ereferenceNoPrefix +
        (form ? (form.formId.substring(0, 3) + '-') : '') +
        userInfo.userId.slice(-5) + '-' +
        moment().unix(),
    };

    // compile sms and email templates
    compileSmsEmailTemplate(returnObj, form, data, userInfo);

    if (data.info)
      _.assign(returnObj, data.info);
    _.assign(returnObj, data.transaction);
    if (form)
      _.assign(returnObj, form);

    return returnObj;
  }

  function buildSubmissionObj(_data, form) {
    return {
      reqHeader: getReqHeader(),
      reqBody: {
        appVersionNo: AppMeta.appVer,
        data: buildSubmissionData(_data, form),
      },
    };
  }

  function compileSmsEmailTemplate(returnObj, form, data, userInfo) {
    var dateTime = moment().format('Do MMM YYYY h:mm a');
    // var ownerName = UserService.customer().name;
    var ownerName = data.info.ownName;
    var templateType = form.templateTypeSMS || form.templateType;
    var policyNo = data.info.policyNo;

    if (form.formType === AppMeta.forms.MedicalReplacement.formType) {
      var addr1 = data.transaction.address1;
      var addr2 = data.transaction.address2;
      var addr3 = data.transaction.address3;
      var postcode = data.transaction.postCode;
      var state = data.transaction.state;

      returnObj.smsTemplate = TemplateService.sms.getMedicalCardTemplate();
      returnObj.emailBody = TemplateService.email.getMedicalCardTemplate(ownerName, templateType, dateTime, policyNo, addr1, addr2, addr3, postcode, state);
    } else if (form.formType === AppMeta.forms.ScheduleTopUp.formType) {
      var amount = data.transaction.grandTotal;
      // TODO: uncomment this for iServe
      // returnObj.emailBody = TemplateService.email.getGeneralTemplate(ownerName, templateType, dateTime, policyNo);
      returnObj.smsTemplate = TemplateService.sms.getTopUpTemplate(templateType);
      returnObj.emailBody = TemplateService.email.getTopUpTemplate(ownerName, templateType, dateTime, policyNo, amount);
      delete data.transaction.grandTotal;

    } else if (form.formType === AppMeta.forms.AdHocTopUp.formType) {
      var amount = data.transaction.grandTotal;
      returnObj.smsTemplate = TemplateService.sms.getTopUpTemplate(templateType);
      returnObj.emailBody = TemplateService.email.getTopUpTemplate(ownerName, templateType, dateTime, policyNo, amount);
      delete data.transaction.grandTotal;
    } else if (form.formType === AppMeta.forms.ChangePayment.formType) {
      returnObj.emailBody = TemplateService.email.getGeneralTemplate(ownerName, templateType, dateTime, policyNo.join(', <br>'));
      delete data.info.policyNo;
    }

    // default to general sms template
    if (!returnObj.smsTemplate) {
      returnObj.smsTemplate = TemplateService.sms.getGeneralTemplate(templateType);
    }

    // default to general email template
    if (!returnObj.emailBody) {
      returnObj.emailBody = TemplateService.email.getGeneralTemplate(ownerName, templateType, dateTime, policyNo);
    }

    returnObj.emailSubject = templateType + ' request';
  }

  function sendSMSEmail(submitObj) {
    var user = UserService.user.user();
    var customer = UserService.customer();

    // send SMS
    var smsObj = {
      NRIC: '',
      mobileNo: '',
      userID: user.userId,
      tac: '',
      smsText: submitObj.reqBody.data.smsTemplate,
      dept: 'POS',
    };
    // (viknesh) special case for change of address, send new mobileNo instead of NRIC
    if (submitObj.reqBody.data.formType === AppMeta.forms.COA.formType)
      smsObj.mobileNo = submitObj.reqBody.data.newMobile;
    else
      smsObj.NRIC = user.nric ? iServe(user.nric) : customer.nric;

    // send Email
    var referenceId = moment().unix() + '' + parseInt(SecurityService.getRandomNumber() * 1000);
    var emailObj = {
      NRIC: user.nric ? iServe(user.nric) : customer.nric,
      id: referenceId, // random id max of 20 length
      source: 'CE', // need to change to iServe for iServe
      senderEmail: 'noreply@aia.com',
      recipientEmail: submitObj.reqBody.data.email,
      ccEmail: '',
      bccEmail: '',
      subject: submitObj.reqBody.data.emailSubject,
      emailBody: submitObj.reqBody.data.emailBody,
      emailStatus: 'P',
      createdDate: moment().format('YYYY-MM-DD hh:mm:ss.SSS'),
      referenceId: referenceId,
      // attachment: submitObj.reqBody.data.attachment,
      // attachmentType: submitObj.reqBody.data.attachmentType,
      // attachmentName: submitObj.reqBody.data.attachmentName,
      attachmentInfo: submitObj.reqBody.data.attachmentInfo,
      attachmentSource: submitObj.reqBody.data.attachmentSource,
    };
    if (submitObj.reqBody.data.formType === AppMeta.forms.COA.formType)
      emailObj.recipientEmail = submitObj.reqBody.data.newEmail;

    var requestObjSms = buildReqObj();
    requestObjSms.reqBody = smsObj;
    var requestObjEmail = buildReqObj();

    requestObjEmail.reqBody = emailObj;

    BaseResourcesService.HttpNoEnc(requestObjSms, ServerUrls.sendSMS);
    BaseResourcesService.HttpNoEnc(requestObjEmail, ServerUrls.sendEmail);


    delete submitObj.reqBody.data.smsTemplate;
    delete submitObj.reqBody.data.emailSubject;
    delete submitObj.reqBody.data.emailBody;
  }

  return {
    activation: function() {
      var userInfo = UserService.user.user();
      var data = {
        code: userInfo.userId,
        pass: userInfo.alppPass ? userInfo.alppPass : null,
        nric: userInfo.nric ? iServeNRIC(userInfo.nric) : null,
        actionType: 0,
      };
      return BaseResourcesService.HttpCall(data, ServerUrls.activation);
    },

    reActivation: function() {
      var userInfo = UserService.user.user();
      var data = {
        code: userInfo.userId,
        pass: userInfo.alppPass,
        nric: iServeNRIC(userInfo.nric),
        actionType: 1,
      };
      return BaseResourcesService.HttpCall(data, ServerUrls.activation);
    },

    afterSetPassword: function() {
      var data = {
        code: UserService.user.userId(),
      };
      return BaseResourcesService.HttpCall(data, ServerUrls.afterSetPassword);
    },

    policySearch: function(info, policyDashBoardFlag) {
      var requestObj = buildReqObj();
      requestObj.reqBody.paymentInfoFlag = 'Y';

      if (policyDashBoardFlag)
        requestObj.reqBody.policyDashBoardFlag = 'Y';
      else
        requestObj.reqBody.policyDashBoardFlag = 'N';

      // creditCard call:
      if (!info) {
        info = {};
        var tmp = UserService.customer();
        if (!tmp) return null;
        info.customerID = tmp.nric;
        info.dob = tmp.dob;
      }

      if (info.customerID.length === 12) {
        requestObj.reqBody.NRIC = info.customerID;
        requestObj.reqBody.dob = getDobFromNRIC(info.customerID);
      } else {
        requestObj.reqBody.NRIC = info.customerID;
        requestObj.reqBody.dob = moment(info.dob).format('YYYYMMDD');
      }

      UserService.customer({
        nric: info.customerID,
        dob: requestObj.reqBody.dob,
      });

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.policySearch);
    },

    getDetails: function(policyNo) {
      var requestObj = buildReqObj();

      requestObj.reqBody.policyNo = policyNo;

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.policyInquiry);
    },

    paymentInquiry: function paymentInquiry() {
      var requestObj = buildReqObj();
      var customer = UserService.customer();
      if (!customer) throw 'Customer ID Not Found.';

      var info = {};
      info.customerID = customer.nric;
      info.dob = customer.dob;

      // requestObj.reqBody.NRIC = customerID;
      if (info.customerID.length === 12) {
        requestObj.reqBody.NRIC = info.customerID;
        requestObj.reqBody.dob = getDobFromNRIC(info.customerID);
      } else {
        requestObj.reqBody.otherIC = info.customerID;
        requestObj.reqBody.dob = info.dob;
      }

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.paymentInquiry);

    },

    getMedicalCardInfo: function getMedicalCardInfo(policyNo) {
      var requestObj = buildReqObj();
      requestObj.reqBody.policyNo = policyNo;

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.medicalCardInquiry);

    },

    getFundSwitchingDetail: function getFundSwitchingDetail(policyNo, lineOfBiz) {
      var requestObj = buildReqObj();
      requestObj.reqBody.policyNo = policyNo;
      requestObj.reqBody.lineOfBiz = lineOfBiz;

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.fundSwitchingDetail);
    },

    getTopUpDetails: function getTopUpDetails(info) {
      var requestObj = buildReqObj();
      requestObj.reqBody.productType = info.productType;
      requestObj.reqBody.lineOfBiz = info.lineOfBiz;

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.topUpDetails);
    },

    getScheduleTopUpDetails: function getScheduleTopUpDetails(planCode, freq, productType) {
      var requestObj = buildReqObj();
      if (productType)
        requestObj.reqBody.productType = productType;
      if (planCode)
        requestObj.reqBody.planCode = planCode;
      if (freq)
        requestObj.reqBody.freq = freq;

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.scheduleDetails);
    },

    getDirectCreditBanksInfo: function getDirectCreditBanksInfo(info) {
      var requestObj = buildReqObj();
      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.directCreditBankList);
    },

    getDirectCreditDetail: function directCreditDetail(policyNo) {
      var requestObj = buildReqObj();

      var customer = UserService.customer();
      if (!customer) throw 'Customer ID Not Found.';

      if (customer.nric && customer.nric.length === 12) {
        requestObj.reqBody.NRIC = customer.nric;
      } else {
        if (!customer) throw 'Customer ID is invalid.';
      }

      requestObj.reqBody.policyNumber = policyNo;
      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.directCreditDetail);
    },

    directCreditUpdate: function directCreditUpdate(policies) {
      var requestObj = buildReqObj();
      requestObj.reqBody.directCreditUpdateAcctInfo = policies;

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.directCreditUpdate);
    },

    preOnlinePayment: function preOnlinePayment(policies, xField1) {
      var userInfo = UserService.user.user();
      var requestObj = buildReqObj();
      requestObj.reqBody = {
        channel: AppMeta.appRefNo,
        userId: userInfo.userId,
        xField1: xField1,
        transactionPaymentInfo: policies,
      };

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.preIpayPayment);

    },

    postOnlinePayment: function postOnlinePayment(info) {
      var requestObj = {
        reqHeader: getReqHeader(),
        reqBody: info,
      };

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.postIpayPayment);

    },
    requestOTP: function(obj, coa) {
      var customer = UserService.customer();
      var userInfo = UserService.user.user();
      if (obj.mobileNo) {
        obj.mobileNo = obj.mobileNo.toString().replace(/\D/g, '');
        obj.mobileNo = obj.mobileNo.substr(0, 1) == 1 ? '0' + obj.mobileNo : obj.mobileNo;
      }

      var data = {
        reqHeader: getReqHeader(),
        reqBody: {
          mobileNo: coa ? obj.mobileNo : '', //Only for CX requirement by viky
          NRIC: coa ? '' : customer.nric, //Only for CX requirement by viky
          resendFlag: '0',
          transactionName: obj.transactionName,
          username: userInfo.userId,
          // email: obj.email
        },
      };
      return BaseResourcesService.HttpNoEnc(data, ServerUrls.sendOTP);
    },

    verifyOTP: function(obj, coa) {
      var customer = UserService.customer();
      var userInfo = UserService.user.user();
      if (obj.mobileNo) {
        obj.mobileNo = obj.mobileNo.toString().replace(/\D/g, '');
        obj.mobileNo = obj.mobileNo.substr(0, 1) == 1 ? '0' + obj.mobileNo : obj.mobileNo;
      }
      var data = {
        reqHeader: getReqHeader(),
        reqBody: {
          mobileNo: coa ? obj.mobileNo : '', //Only for CX requirement by viky
          NRIC: coa ? '' : customer.nric, //Only for CX requirement by viky
          sessionId: obj.sessionId,
          resendFlag: '0',
          transactionName: obj.transactionName,
          userName: userInfo.userId,
          // email: obj.email,
          token: obj.token
        },
      };
      return BaseResourcesService.HttpNoEnc(data, ServerUrls.verifyOTP);
    },

    calculateGap: function calculateGap(info) {
      var requestObj = {
        reqHeader: getReqHeader(),
        reqBody: info,
      };

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.paymentCycleGap);

    },

    crsInquiry: function crsInquiry(info) {
      var requestObj = buildReqObj();
      requestObj.reqBody.companyCode = info.companyCode;
      requestObj.reqBody.idType = info.idType;
      requestObj.reqBody.clientId = info.clientId;

      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.crsInquiry);
    },

    appVer: function appVer() {
      var requestObj = {
        reqHeader: getReqHeader(),
        reqBody: {},
      };

      requestObj.reqBody.appName = AppMeta.appRefNo;
      return BaseResourcesService.HttpNoEnc(requestObj, ServerUrls.appVer);

    },
    submission: {
      medicalCard: function medicalCard(info) {
        var form = AppMeta.forms.MedicalReplacement;
        var submissionObj = buildSubmissionObj(info, form);
        sendSMSEmail(submissionObj);
        return BaseResourcesService.HttpNoEnc(submissionObj, ServerUrls.medicalCardSubmission);
      },

      submitCancelAutoDebit: function submitCancelAutoDebit(data) {
        var form = AppMeta.forms.CancellationAutoDebit;
        var payload = buildSubmissionObj(data, form);

        sendSMSEmail(payload);
        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.cancelAutoDebitSubmission);
      },

      submitCreditCard: function submitCreditCard(data) {
        var form = AppMeta.forms.CreditCard;
        var payload = buildSubmissionObj(data, form);

        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.creditCardSubmission);
      },

      submitPostCreditCard: function submitPostCreditCard(data) {
        var payload = {
          reqHeader: getReqHeader(),
          reqBody: data,
        };
        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.creditCardPostSubmission);
      },

      creditCardSendSMS: function creditCardSendSMS(data) {
        var form = AppMeta.forms.CreditCard;
        var payload = buildSubmissionObj(data, form);

        sendSMSEmail(payload);
      },


      submitCOA: function submitCOA(data, canSendSMSEmail) {
        var form = AppMeta.forms.COA;
        var payload = buildSubmissionObj(data, form);
        if (!_.isEmpty(data.transaction.fatca))
          _.assignIn(payload.reqBody.data, {
            fatcaFlag: data.transaction.fatca.fatcaFlag,
            fatcaType: data.transaction.fatca.fatcaType,
            fatcaReceivedDate: moment().format('YYYY-MM-DD HH:mm:ss.SSS'),
            fatcaAccountName: data.info.ownName,
            fatcaAddress1: (data.transaction.fatca.w8.addressInfo) ? data.transaction.fatca.w8.addressInfo.address1 : '',
            fatcaAddress2: (data.transaction.fatca.w8.addressInfo) ? data.transaction.fatca.w8.addressInfo.address2 : '',
            fatcaAddress3: (data.transaction.fatca.w8.addressInfo) ? data.transaction.fatca.w8.addressInfo.address3 : '',
            fatcaPostalcode: (data.transaction.fatca.w8.addressInfo) ? data.transaction.fatca.w8.addressInfo.postCode : '',
            fatcaState: (data.transaction.fatca.w8.addressInfo) ? data.transaction.fatca.w8.addressInfo.state : '',
            fatcaCountry: (data.transaction.fatca.w8.addressInfo) ? data.transaction.fatca.w8.addressInfo.country.key : '',
            fatcaSSNO: data.transaction.fatca.w9.ssn || data.transaction.fatca.w8.ssn || '',
            fatcaExemptionCode: data.transaction.fatca.w9.fatcaCode,
            fatcaW9SSNOFlag: data.transaction.fatca.w9.ssnCheck,
            fatcaAccountNo: data.transaction.fatca.w9.listofAcc,
            fatcaForeignTaxNo: data.transaction.fatca.w8.tin,
            fatcaDOB: data.transaction.fatca.w8.dob ? moment(new Date(data.transaction.fatca.w8.dob)).format('YYYY-MM-DD') : '',
            fatcaRefNo: data.transaction.fatca.w8.referenceNo,
            fatcaW8SSNOFlag: data.transaction.fatca.w8.noSsn,
            fatcaW8TINFlag: data.transaction.fatca.w8.noTin,
            fatcaCountryCitizenship: (data.transaction.fatca.w8.ownerDetails) ? data.transaction.fatca.w8.ownerDetails.citizenshipCountry : '',
            fatcaTreatyCountry: (data.transaction.fatca.w8.ownerDetails) ? data.transaction.fatca.w8.ownerDetails : '',
            fatcaArticle: (data.transaction.fatca.w8.ownerDetails) ? data.transaction.fatca.w8.ownerDetails.article_name : '',
            fatcaPercentage: (data.transaction.fatca.w8.ownerDetails) ? data.transaction.fatca.w8.ownerDetails.percentage : '',
            fatcaIncome: (data.transaction.fatca.w8.ownerDetails) ? data.transaction.fatca.w8.ownerDetails.type_of_income : '',
            fatcaReason: (data.transaction.fatca.w8.ownerDetails) ? data.transaction.fatca.w8.ownerDetails.type_of_income : '',
          });
        delete payload.reqBody.data.fatca;
        if (canSendSMSEmail)
          sendSMSEmail(payload);
        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.coaSubmission);
      },

      submitChangePaymentCycle: function submitChangePaymentCycle(data) {
        var form = AppMeta.forms.ChangePayment;
        var payload = buildSubmissionObj(data, form);

        sendSMSEmail(payload);
        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.paymentCycleSubmission);
      },

      submitPaymentReceipt: function submitPaymentReceipt(data) {
        var payload = buildReqObj();
        var staff = UserService.staff.get();
        var dateTime = moment().format('Do MMM YYYY h:mm a');
        var ownerName = UserService.customer().name;
        payload.reqBody.userLANId = UserService.user.userId();
        payload.reqBody.branchCodeLAOrLAFT = "";
        payload.reqBody.branchCodePA = "";
        payload.reqBody.paymentType = data.paymentType || 'C';
        payload.reqBody.cashierIdLA = staff.laCashierId;
        payload.reqBody.cashierIdLAFT = staff.laftCashierId;
        payload.reqBody.cashierIdPA = staff.polaCashierId;
        payload.reqBody.approvalCode = data.approvalCode; // "iPayCode007", // TODO: load iPay actual approval code
        payload.reqBody.paymentDetails = data.paymentDetails;

        // compile sms and email templates (special case for payment)
        var amount = 0;
        _.each(data.paymentDetails, function(item) {
          amount += parseFloat(item.totalPremiumAmount);
        });
        var datetime = moment().format('Do MMM YYYY h:mm a');
        amount = amount.toFixed(2);

        payload.reqBody.data = {};
        payload.reqBody.data.smsTemplate = TemplateService.sms.getPaymentTemplate(amount, datetime);
        payload.reqBody.data.emailBody = TemplateService.email.getPaymentTemplate(ownerName, dateTime, amount);
        payload.reqBody.data.emailSubject = 'Payment request';
        payload.reqBody.data.attachment = '';
        payload.reqBody.data.attachmentType = 'html';
        payload.reqBody.data.attachmentName = '';
        payload.reqBody.data.attachmentSource = 'TRIO';

        // sendSMSEmail(payload);
        var smsPayload = _.cloneDeep(payload);
        delete payload.reqBody.data;

        return new Promise(function(resolve, reject) {
          BaseResourcesService.HttpNoEnc(payload, ServerUrls.paymentReceipt)
            .then(function success(res) {
              return resolve({
                res: res,
                smsPayload: smsPayload
              });
            }, function fail(err) {
              reject(err);
            });
        });
      },
      sendReceiptSMSEmail: sendSMSEmail,

      submitFundSwitching: function submitFundSwitching(data) {
        var form = AppMeta.forms.FundSwitching;
        var payload = buildSubmissionObj(data, form);

        sendSMSEmail(payload);
        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.fundSwitchingSubmission);
      },

      submitAdHocTopUp: function submitAdHocTopUp(data) {
        var payload = buildReqObj();
        var form = AppMeta.forms.AdHocTopUp;
        var payload = buildSubmissionObj(data, form);

        sendSMSEmail(payload);
        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.adHocTopUpSubmission);
      },

      submitScheduleTopUp: function submitScheduleTopUp(data) {
        var payload = buildReqObj();
        var form = AppMeta.forms.ScheduleTopUp;
        var payload = buildSubmissionObj(data, form);

        sendSMSEmail(payload);
        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.scheduleTopUpSubmission);
      },

      DirectCredit: function DirectCredit(info) {
        var form = AppMeta.forms.DirectCredit;
        var submissionObj = buildSubmissionObj(info, form);

        sendSMSEmail(submissionObj);
        return BaseResourcesService.HttpNoEnc(submissionObj, ServerUrls.directCreditSubmission);
      },

      submitGiwl: function submitGiwl(data) {
        // TODO: giwl submission
        // var payload = buildReqObj();
        // var form = AppMeta.forms.TopUp;
        // var payload = buildSubmissionObj(data, form);

        // return BaseResourcesService.HttpNoEnc(payload, ServerUrls.topUpSubmission);
      },

      createOnlinePayment: function createOnlinePayment(data) {
        var payload = buildReqObj();
        var form = {};
        var payload = buildSubmissionObj(data, form);

        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.createOnlinePayment);
      },

      updateOnlinePayment: function updateOnlinePayment(data) {
        var payload = buildReqObj();
        var form = {};
        var payload = buildSubmissionObj(data, form);

        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.updateOnlinePayment);
      },

      crsUploadDocs: function crsUploadDocs(data) {
        var userInfo = UserService.user.user();
        var payload = buildReqObj();
        payload.reqBody.CreatedBy = userInfo.userId;
        payload.reqBody.Channel = payload.reqHeader.channel;
        payload.reqBody.attachment = data;

        return BaseResourcesService.HttpNoEnc(payload, ServerUrls.crsUploadDocs);
      },
    },

  };
});