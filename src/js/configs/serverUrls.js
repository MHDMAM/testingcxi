angular.module('app')
  .value('ServerUrls', {
    baseURI: 'https://www.aia-uat.com.my/triocx/services/',
    // baseURI: 'https://www.aia-uat.com.my/triocxv2/services/', // UAT
    // baseURI: 'https://www.pbdirectaia.com.my/TRIOCXMYV2/triocxservice/', // prod

    // baseURI: (_ENV_PROD === true) ? 'https://www.pbdirectaia.com.my/TRIOCXMYV2/triocxservice/' : 'https://www.aia-uat.com.my/triocxv2/services/',

    serverPublicKeyURL: 'triokey',
    activation: 'activationcx',
    afterSetPassword: 'updactivationcx',
    policySearch: 'polsearchcx',
    policyInquiry: 'poldetailcx',
    paymentInquiry: 'cashPaymentDetail',
    medicalCardInquiry: 'medicalCardDetail',

    medicalCardSubmission: 'medicalCardSubmissioncx',

    creditCardSubmission: 'creditCardSubmissioncx',
    creditCardPostSubmission: 'creditCardUpdatecx',

    coaSubmission: 'changeofContactSubmissioncx',

    cancelAutoDebitSubmission: 'cancelAutoDebitSubmissioncx',

    paymentCycleSubmission: 'changePaymentModeSubmissioncx',
    paymentCycleGap: 'paymentModeDetail',
    fundSwitchingSubmission: 'fundSwitchSubmissioncx',

    paymentReceipt: 'cashReceipt',

    fundSwitchingDetail: 'fundSwitchDetail',
    topUpDetails: 'adhoctopupDetailcx',
    scheduleDetails: 'scheduletopupDetailcx',

    adHocTopUpSubmission: 'adhoctopupcx',

    scheduleTopUpSubmission: 'scheduletopupcx',

    directCreditBankList: 'directCreditBankcx',
    directCreditSubmission: 'directCreditInstructioncx',
    directCreditDetail: 'directCreditDetailcx',
    directCreditUpdate: 'directCreditUpdatecx',

    createOnlinePayment: 'createOnlinePaymentcx',
    updateOnlinePayment: 'updateOnlinePaymentcx',
    appVer: 'appInfoServe',
    
    // email & SMS & OTP
    sendSMS: 'sendSMScx',
    sendEmail: 'sendEmailcx',
    sendOTP: 'sendotpcx',
    verifyOTP: 'verifyotpcx',

    preIpayPayment: 'createOnlinePaymentcx',
    postIpayPayment: 'updateOnlinePaymentcx',

    crsInquiry: 'crsInquirycx',
    crsUploadDocs: 'crsUploadcx',

  });