# Deployment Troubleshooting Guide

## Purpose
This document provides a structured template for diagnosing and resolving deployment failures.

## Failure Triage Template

### 1. Identify Failure Point

Check each stage and mark where the failure occurred:

- [ ] **Dependency Installation** (`pnpm install`)
  - Error message: _______________
  - Failed package: _______________

- [ ] **Backend Deployment** (`dfx deploy backend`)
  - Error message: _______________
  - Canister ID: _______________

- [ ] **Candid Generation** (`dfx generate backend`)
  - Error message: _______________
  - Missing types: _______________

- [ ] **Frontend Build** (`pnpm run build:skip-bindings`)
  - Error message: _______________
  - Failed file: _______________
  - Build step: _______________

- [ ] **Frontend Deployment** (`dfx deploy frontend`)
  - Error message: _______________
  - Canister ID: _______________

- [ ] **Runtime/Browser** (after deployment completes)
  - Error message: _______________
  - Console errors: _______________
  - Network failures: _______________

### 2. Exact Error Text

