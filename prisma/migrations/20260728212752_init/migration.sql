-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "shipment_id" INTEGER,
    "filename" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "upload_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" INTEGER,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ships" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "imo" VARCHAR(50),
    "captain" VARCHAR(150),
    "status" VARCHAR(50) NOT NULL DEFAULT 'In Transit',
    "location" VARCHAR(150),
    "destination" VARCHAR(150),
    "eta" TIMESTAMP(6),

    CONSTRAINT "ships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'Viewer',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
