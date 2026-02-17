-- CreateTable
CREATE TABLE "cached_competitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "emblemUrl" TEXT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cached_seasons" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "currentMatchday" INTEGER,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cached_teams" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "tla" TEXT NOT NULL,
    "crestUrl" TEXT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cached_matches" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "matchday" INTEGER NOT NULL,
    "utcDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "homeTeamName" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "ftHomeScore" INTEGER,
    "ftAwayScore" INTEGER,
    "htHomeScore" INTEGER,
    "htAwayScore" INTEGER,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_logs" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_usage_logs_provider_timestamp_idx" ON "api_usage_logs"("provider", "timestamp");

-- AddForeignKey
ALTER TABLE "cached_seasons" ADD CONSTRAINT "cached_seasons_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "cached_competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cached_teams" ADD CONSTRAINT "cached_teams_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "cached_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cached_matches" ADD CONSTRAINT "cached_matches_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "cached_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
