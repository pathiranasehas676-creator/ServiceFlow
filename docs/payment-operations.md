# Payment Operations Guide

## Overview
The ServiceFlow Payment Operations Console enables strict financial control over worker earnings and payouts.

## Core Workflows

### 1. Earning Funds
- **Job Completion**: When a job proof is approved by an Admin, the worker's wallet is immediately credited.
- **Transaction Type**: `CREDIT`
- **Balance Impact**: `Available Balance` increases.

### 2. Requesting Payout
- **Worker Action**: Workers request payouts from their dashboard.
- **System Action**: Funds are moved from `Available` to `Pending` (Held).
- **Transaction Type**: `HOLD`

### 3. Admin Processing
Admins manage requests in the **Payout Processing** tab.

#### Approval
- **Action**: Verify worker eligibility. Click "Approve".
- **System**: Status changes to `APPROVED`. Funds remain `Held`.

#### Rejection
- **Action**: Click "Reject" and provide reason.
- **System**: Funds are released back to `Available`.
- **Transaction Type**: `RELEASE`

#### Payment Completion
- **Action**: Admin executes external payment (Bank/Wire).
- **Confirmation**: Admin clicks "Mark Paid" and uploads the Receipt image/PDF.
- **System**: Funds are debited from `Pending`. Receipt is stored.
- **Transaction Type**: `DEBIT` (from Pending)

## Reconciliation
The system enforces a strict double-entry style ledger logic:
- `Wallet Balance = Sum(Transactions)` check is performed automatically.
- Ensure all manual adjustments use the "Adjust Balance" feature in the Wallet list, which creates a proper Audit Log.
