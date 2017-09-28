Trio Front-End Change Log
=========================

v0.1.x
------
### Features
- Framework building
- Login screen
- User Activation
- User Reactivation
- Policy Search
- Policy dashboard
- Policy Details

v0.2.x
------
### Features
- Medical card replacement
- Accept premium cash payment
- Change Debit/Credit card details

v0.3.x
------
### Features
- Change corresponding address
- Change payment method
- Change payment cycle
- Replace all listings with slide box style
- Add country codes in const.js
- Remove + sign from country codes

### Fixes
- Intercept application or network error event in routes.js and prevent page routing
- Add paymentInfoFlag to policy search API

v0.4.x
------
### Features
- Online Payment integration with iPay88
- Cash Payment submission API integration
- Add filter and search function to policy dashboard
- Add side menu in policy search screen
- Integrate payment receipt submission
- Add mobile number masking filter

### Fixes
- Fixed Allocation decimal point precision to 2 in policy details
- UI change for popover, some UI adjustment on the logout and language labels
- In policy details, set slide box index to first page after filter or search to avoid empty page issue
- Fixed paymentMethodeCode validation in policy details

### Pending
- Payment cycle needs gst amount for alternative frequencies
- Side menu items


v0.5.x
------
- Add hoc Top Up.
- Schedule Top UP.
- Fund Switching.
- Details page, hide investment Portfolio tab if no data.
- Revamp policy inquiry and allow passing data form others transaction (like topup) without querying the server.
- Add DOB when inquiry the server with NRIC.
- Move transaction conditions to PolicyService.
- Change the "WILAYAH PERSEKUTUAN" to "WP".
- Change SVGs
- Ensure to clean all cache when go back to Policy search page.
- Add bonus to details page.
- Catch exceptions of wrong password.
- Ensure to remove data from template module.
- Filter data by user agent.
- Fix show cancel auto debit conditions for POLA.
- Fix Medical Card replacement
- Filter data on cancel auto debit 
- Payment add missing fields and fix for ETI status.
- Added side menu to reset password page.
- Inquiry Funds
- Payment Total logic (in case of reinstatement) + GST.

#### TODO:
- Change payment cycle.
- Change of contact details make it call same API twice.
- Submit Fund switching.
- Submit Top Up
- Uses Status code instead of description.
- ETI, SVE & Lapsed can pay only if reinstatementFlas ==='Y'


v0.6.x
------
- Direct Credit
- Health Certificate
	- Medical Examination
	- Giwl
- Bring originalPolicies data from policyDashboard to policyDetails
- Direct Credit Bank Listing Api


