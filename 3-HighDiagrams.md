# Neutrl Protocol System Architecture Diagrams

## 1. High-Level System Architecture

```mermaid
graph TD
    U[Users] --> R[Router<br/>Main Entry Point]
    
    R --> SM["StableMinter<br/>mint()"]
    R --> RED["Redeemer<br/>redeem()"]
    
    SM --> NUSD[NUSD Token<br/>mint/burn]
    RED --> NUSD
    
    NUSD --> sNUSD[sNUSD Vault<br/>ERC4626 Staking]
    
    R --> AR[AssetReserve<br/>Liquid Buffer]
    AR --> C[Custodians<br/>Off-chain Yield]
    
    YD[YieldDistributor<br/>convertYieldToNUSD<br/>distributeYield] --> sNUSD
    
    sNUSD --> S[Silo<br/>Cooldown Assets]
    
    AL[AssetLock<br/>Time-locked Assets] --> U
    
    O[Price Oracles<br/>ERC-7726] --> SM
    O --> RED
    
    KB[Keeper Bots<br/>KEEPER_ROLE] --> R
    YB[Yield Bots<br/>YIELD_TOKEN_MANAGER_ROLE] --> YD
    
    style U fill:#e1f5fe,color:#000
    style NUSD fill:#fff3e0,color:#000
    style sNUSD fill:#e8f5e8,color:#000
    style AR fill:#fce4ec,color:#000
    style C fill:#f3e5f5,color:#000
```

## 2. Token Flow Architecture

```mermaid
graph TD
    subgraph "Collateral Assets"
        USDC[USDC]
        USDT[USDT]
        USDe[USDe]
    end
    
    subgraph "Minting Flow"
        USDC --> R1[Router.mint]
        USDT --> R1
        USDe --> R1
        R1 --> SM[StableMinter.mint]
        SM --> N1[NUSD.mint]
        R1 --> AR1[AssetReserve]
        AR1 --> CUST[Custodians<br/>Off-chain Deployment]
    end
    
    subgraph "Staking Flow"
        N1 --> sN[sNUSD.deposit]
        sN --> N2[NUSD Balance]
        N2 --> YIELD[Yield Generation]
    end
    
    subgraph "Reward Flow"
        CUST --> YT[Yield Tokens<br/>USDC/USDT/USDe]
        YT --> YD[YieldDistributor.convertYieldToNUSD]
        YD --> R2[Router.mint]
        R2 --> YN[NUSD Rewards]
        YN --> sN2[sNUSD.transferInRewards]
    end
    
    subgraph "Redemption Flow"
        N3[NUSD] --> R3[Router.redeem]
        R3 --> RED[Redeemer.redeem]
        RED --> NB[NUSD.burn]
        R3 --> AR2[AssetReserve.processRedemption]
        AR2 --> COL[Collateral Assets]
    end
```

## 3. Dual-Mode Operations Flow

```mermaid
graph TD
    U[User Request] --> R[Router]
    
    subgraph "Mint Mode Decision"
        R --> MM{getMintMode}
        MM --> MIA[INSTANT<br/>Always Available]
        MM --> MIQ[QUEUED<br/>Never Used for Minting]
        MIA --> MIM[StableMinter.mint<br/>Immediate Execution]
    end
    
    subgraph "Redeem Mode Decision"
        R --> RM{getRedemptionMode}
        RM --> RMC{AssetReserve<br/>Has Sufficient Liquidity?}
        RMC -->|Yes| RIA[INSTANT<br/>Direct Redemption]
        RMC -->|No| RIQ[QUEUED<br/>Wait for Processing]
        
        RIA --> RIM[Redeemer.redeem<br/>Immediate Execution]
        RIQ --> RRQ[Store in redemptionRequests]
        RRQ --> KB[Keeper Bot<br/>serveRedemptionRequest]
        KB --> RIM
    end
    
    subgraph "Queue Processing"
        MRQ[mintRequests<br/>Storage] --> KB2[Keeper Bot<br/>serveMintRequest]
        KB2 --> MIM
        
        RRQ --> KB3[Keeper Bot<br/>2 Day Processing]
        KB3 --> RIM
    end
    
    style MIA fill:#4caf50,color:#fff
    style RIA fill:#4caf50,color:#fff
    style MIQ fill:#ff9800,color:#fff
    style RIQ fill:#ff9800,color:#fff
```

## 4. Tokenomics & Economic Incentives

```mermaid
graph TD
    subgraph "User Incentives"
        U1[Regular Users<br/>Mint NUSD] --> M1[Pay Protocol-Favorable Pricing<br/>min price ≥ 0.97 USD]
        U2[Stakers<br/>Stake NUSD → sNUSD] --> R1[Earn Yield from Off-chain Deployment<br/>8-hour vesting 30-day cooldown]
        U3[Redeemers<br/>Redeem NUSD] --> M2[Pay Protocol-Favorable Pricing<br/>max price ≤ 1.03 USD]
    end
    
    subgraph "Protocol Economics"
        M1 --> PP[Protocol Profit<br/>Favorable Pricing Spread]
        M2 --> PP
        PP --> YG[Yield Generation<br/>98% TVL Off-chain]
        YG --> YR[Yield Returns<br/>Via YieldDistributor]
    end
    
    subgraph "Off-chain Participants"
        C1[Custodians<br/>AUTHORIZED role] --> OD[Off-chain Deployment<br/>Yield Strategies]
        OD --> YT[Yield Tokens<br/>USDC USDT USDe]
        YT --> YD[YieldDistributor<br/>Conversion to NUSD]
    end
    
    subgraph "Bot Operators"
        KB[Keeper Bots<br/>KEEPER_ROLE] --> QP[Queue Processing<br/>serveMintRequest serveRedemptionRequest]
        YB[Yield Manager Bots<br/>YIELD_TOKEN_MANAGER_ROLE] --> YC[Yield Conversion<br/>convertYieldToNUSD distributeYield]
        QP --> IF[Infrastructure Fees]
        YC --> IF
    end
    
    subgraph "Game Theory"
        PP --> PV[Protocol Value<br/>Sustainable Yield Model]
        R1 --> UV[User Value<br/>Yield-bearing Stablecoin]
        PV --> UV
        UV --> AL[Aligned Incentives<br/>Long-term Staking]
    end
    
    style PP fill:#4caf50,color:#fff
    style YR fill:#2196f3,color:#fff
    style AL fill:#9c27b0,color:#fff
```

## 5. Role-Based Access Control & Governance

```mermaid
graph TD
    subgraph "Admin Hierarchy"
        DA[DEFAULT_ADMIN_ROLE<br/>Full Protocol Control]
        DA --> AR[Add/Remove Other Roles]
        DA --> PC[Protocol Configuration]
        DA --> EC[Emergency Controls]
    end
    
    subgraph "Operational Roles"
        KR[KEEPER_ROLE<br/>Queue Processing] --> QO[serveMintRequest<br/>serveRedemptionRequest<br/>cancelRequests]
        YR[YIELD_TOKEN_MANAGER_ROLE<br/>Yield Management] --> YO[convertYieldToNUSD<br/>distributeYield]
        PR[PAUSER_ROLE<br/>Emergency Response] --> PO[pause/unpause<br/>Router sNUSD AssetLock]
    end
    
    subgraph "Access Control Roles"
        WR[WHITELISTER_ROLE<br/>Access Management] --> WO[setMintWhitelisted<br/>setRedeemWhitelisted<br/>Enforcement Toggle]
        DR[DENYLIST_MANAGER_ROLE<br/>NUSD Restrictions] --> DO[addToDenylist<br/>removeFromDenylist]
        BR[BLACKLIST_MANAGER_ROLE<br/>sNUSD Restrictions] --> BO[addToBlacklist<br/>removeFromBlacklist]
    end
    
    subgraph "Asset Management"
        AuthR[AUTHORIZED<br/>Custodian Access] --> AO[transferToCustodian<br/>Asset Reserve Operations]
        RR[REWARDER_ROLE<br/>Reward Distribution] --> RO[transferInRewards<br/>sNUSD Yield Distribution]
    end
    
    subgraph "User Restriction Roles"
        SR[SOFT_RESTRICTED_STAKER_ROLE<br/>Staking Prevented] --> SO[Cannot deposit/mint sNUSD<br/>Can still transfer]
        FR[FULL_RESTRICTED_STAKER_ROLE<br/>Fully Restricted] --> FO[Cannot transfer sNUSD<br/>Cannot stake/unstake<br/>Admin can redistribute]
    end
    
    DA --> KR
    DA --> YR
    DA --> PR
    DA --> WR
    DA --> DR
    DA --> BR
    DA --> AuthR
    DA --> RR
    
    style DA fill:#f44336,color:#fff
    style PR fill:#ff5722,color:#fff
    style FR fill:#795548,color:#fff
    style SR fill:#607d8b,color:#fff
```

## 6. Staking & Cooldown Mechanism

```mermaid
stateDiagram-v2
    [*] --> Staked: deposit/mint NUSD→sNUSD
    
    state Staked {
        [*] --> Earning: Earn yield via vesting
        Earning --> Earning: 8-hour vesting periods
    }
    
    state CooldownDecision <<choice>>
    Staked --> CooldownDecision: User wants to unstake
    
    CooldownDecision --> CooldownActive: cooldownAssets/cooldownShares<br/>30-day cooldown
    CooldownDecision --> DirectWithdraw: withdraw/redeem<br/>if cooldownDuration = 0
    
    state CooldownActive {
        [*] --> WaitingPeriod: Assets locked in Silo
        WaitingPeriod --> ReadyToUnstake: After 30 days
    }
    
    CooldownActive --> Staked: Can continue staking remaining balance
    ReadyToUnstake --> [*]: unstake(receiver)<br/>Withdraw from Silo
    DirectWithdraw --> [*]: Direct withdrawal<br/>ERC4626 standard
    
    note right of CooldownActive
        cooldowns[user].underlyingAmount
        equals assets locked in Silo
        Invariant maintained
    end note
    
    note right of Earning
        totalAssets() = NUSD.balanceOf(this) - getUnvestedAmount()
        Yield vests over 8 hours
        MIN_SHARES = 1 ether protection
    end note
```

## 7. Price Oracle & Risk Management

```mermaid
graph TD
    subgraph "Oracle Integration"
        PO[Price Oracles<br/>ERC-7726 Standard] --> SM[StableMinter]
        PO --> RED[Redeemer]
        PO --> YD[YieldDistributor]
    end
    
    subgraph "Price Boundaries"
        SM --> MPC{Mint Price Check}
        MPC --> MPV[unitPrice ≥ minPrice<br/>0.97 USD]
        MPV --> MPF[Price Favorable Logic<br/>price = min unitPrice 1e18]
        
        RED --> RPC{Redeem Price Check}
        RPC --> RPV[unitPrice ≤ maxPrice<br/>1.03 USD]
        RPV --> RPF[Price Favorable Logic<br/>price = max unitPrice 1e18]
    end
    
    subgraph "Rate Limiting"
        SM --> MRL[maxMintPerBlock<br/>mintedPerBlock tracking]
        RED --> RRL[maxRedeemPerBlock<br/>redeemedPerBlock tracking]
    end
    
    subgraph "Circuit Breakers"
        PA[PAUSER_ROLE] --> PP[Emergency Pause]
        PP --> PSM[Pause Router]
        PP --> PSN[Pause sNUSD]
        PP --> PAL[Pause AssetLock]
    end
    
    subgraph "Asset Risk Management"
        AR[AssetReserve] --> LB[Liquid Buffer ~2% TVL]
        LB --> IR[Instant Redemption Capacity]
        
        C[Custodians] --> OD[Off-chain Deployment ~98% TVL]
        OD --> YS[Yield Strategies]
        
        AL[AssetLock] --> TL[Time Locks 182.5-365 days]
        TL --> ER[Emergency Recovery Controls]
    end
    
    style MPV fill:#4caf50,color:#fff
    style RPV fill:#4caf50,color:#fff
    style PP fill:#f44336,color:#fff
    style YS fill:#2196f3,color:#fff
```

## 8. Yield Distribution & Vesting Flow

```mermaid
sequenceDiagram
    participant C as Custodians
    participant YD as YieldDistributor
    participant R as Router
    participant sN as sNUSD
    participant U as Users
    
    Note over C,YD: Off-chain yield generation
    C->>YD: Transfer yield tokens (USDC/USDT/USDe)
    
    Note over YD: YIELD_TOKEN_MANAGER_ROLE bot
    YD->>YD: convertYieldToNUSD(slippage)
    
    loop For each active yield token
        YD->>R: quoteDeposit(token, amount)
        R-->>YD: NUSD amount quote
        YD->>R: mint(yieldToken, amount, minNUSD)
        R->>YD: NUSD tokens
    end
    
    YD->>sN: distributeYield(nusdAmount)
    sN->>sN: transferInRewards(amount)
    
    Note over sN: Vesting mechanism starts
    sN->>sN: _updateVestingAmount(amount)
    sN->>sN: vestingAmount = amount
    sN->>sN: lastDistributionTimestamp = now
    
    Note over sN,U: 8-hour vesting period
    loop Every block during vesting
        U->>sN: totalAssets()
        sN-->>U: balanceOf(NUSD) - getUnvestedAmount()
        Note over sN: getUnvestedAmount() decreases linearly
    end
    
    Note over U: After 8 hours
    U->>sN: totalAssets()
    sN-->>U: Full NUSD balance (unvested = 0)
```

## 9. Security Architecture & Invariant Protection

```mermaid
graph TD
    subgraph "Core Invariants"
        I1[sNUSD totalAssets ≥ totalSupply<br/>Asset backing integrity]
        I2[cooldownAmount = siloLockedAmount<br/>Cooldown synchronization]
        I3[sum userLocks = totalLocked<br/>Lock accounting integrity]
        I4[totalSupply = 0 OR ≥ MIN_SHARES<br/>Donation attack protection]
    end
    
    subgraph "Access Control Enforcement"
        AC1[Role-based permissions<br/>SingleAdminAccessControl]
        AC2[Whitelist enforcement<br/>Router entry points]
        AC3[Blacklist restrictions<br/>Transfer and staking controls]
        AC4[Emergency pause capabilities<br/>PAUSER_ROLE activation]
    end
    
    subgraph "Economic Security"
        ES1[Protocol-favorable pricing<br/>0.97-1.03 USD bounds]
        ES2[Rate limiting per block<br/>maxMintPerBlock maxRedeemPerBlock]
        ES3[Slippage protection<br/>minNusdAmount minCollateralAmount]
        ES4[Oracle price validation<br/>ERC-7726 integrated checks]
    end
    
    subgraph "Asset Custody Security"
        AS1[Multi-role AssetReserve<br/>Custodian authorization required]
        AS2[Time-locked AssetLock<br/>182.5-365 day enforced locks]
        AS3[Silo cooldown enforcement<br/>30-day unstaking period]
        AS4[Asset reserve liquid buffer<br/>~2% TVL instant redemption]
    end
    
    subgraph "State Consistency Checks"
        SC1[Request status transitions<br/>PENDING→COMPLETED/CANCELLED only]
        SC2[Vesting amount precision<br/>unvestedAmount ≤ vestingAmount]
        SC3[Queue asset conservation<br/>held assets = pending requests sum]
        SC4[Price bounds validation<br/>All operations within limits]
    end
    
    I1 --> AC1
    I2 --> AS3
    I3 --> AS2
    I4 --> ES1
    
    AC1 --> ES1
    AC2 --> ES2
    AC3 --> AS1
    AC4 --> SC1
    
    style I1 fill:#4caf50,color:#fff
    style I2 fill:#4caf50,color:#fff
    style I3 fill:#4caf50,color:#fff
    style I4 fill:#4caf50,color:#fff
    style AC4 fill:#f44336,color:#fff
```

## 10. Integration & Hook Points

```mermaid
graph TD
    subgraph "External Integrations"
        EO[Euler Price Oracle<br/>ERC-7726 Standard] --> OR[Oracle Integration Points]
        OR --> SM[StableMinter.quoteDeposit]
        OR --> RED[Redeemer.quoteRedeem]
        
        OC[Off-chain Systems] --> KB[Keeper Bots]
        OC --> YB[Yield Bots]
        OC --> SB[Security Monitoring Bots]
    end
    
    subgraph "Plugin Architecture"
        R[Router] --> MM[Modular Minters<br/>Per-asset Implementation]
        R --> MR[Modular Redeemers<br/>Per-asset Implementation]
        
        MM --> SM2[StableMinter<br/>USDC/USDT/USDe]
        MR --> RED2[Redeemer<br/>USDC/USDT/USDe]
        
        MM --> FM[Future Minters<br/>Other Asset Types]
        MR --> FR[Future Redeemers<br/>Other Asset Types]
    end
    
    subgraph "Hook Points"
        R --> PH[Pre-mint Hooks<br/>Whitelist validation]
        R --> PostH[Post-mint Hooks<br/>Asset reserve transfer]
        
        sN[sNUSD] --> DH[Deposit Hooks<br/>Blacklist validation<br/>MIN_SHARES check]
        sN --> WH[Withdraw Hooks<br/>Cooldown enforcement<br/>Silo interaction]
        
        YD[YieldDistributor] --> CH[Conversion Hooks<br/>Slippage validation<br/>Token approval]
        YD --> RH[Reward Hooks<br/>sNUSD vesting update]
    end
    
    subgraph "Event Emission Points"
        EE[Event Emitters] --> ME[Mint Events<br/>Tracking user operations]
        EE --> RE[Redeem Events<br/>Tracking redemptions]
        EE --> SE[Staking Events<br/>Deposit withdraw cooldown]
        EE --> YE[Yield Events<br/>Distribution and vesting]
        EE --> AE[Admin Events<br/>Configuration changes]
    end
    
    style SM2 fill:#fff3e0,color:#000
    style RED2 fill:#fff3e0,color:#000
    style FM fill:#e1f5fe,color:#000
    style FR fill:#e1f5fe,color:#000
```
