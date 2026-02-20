terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "resume" {
  cidr_block           = "10.50.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "resume-vpc" }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.resume.id
  cidr_block        = "10.50.1.0/24"
  availability_zone = "${var.aws_region}a"
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.resume.id
  cidr_block        = "10.50.2.0/24"
  availability_zone = "${var.aws_region}b"
}

resource "aws_db_subnet_group" "resume" {
  name       = "resume-db-subnets"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

resource "aws_security_group" "rds" {
  name   = "resume-rds-sg"
  vpc_id = aws_vpc.resume.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "resume" {
  identifier             = "tarun-resume-db"
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = "db.t4g.micro"
  db_name                = "resume"
  username               = var.db_username
  password               = var.db_password
  skip_final_snapshot    = true
  db_subnet_group_name   = aws_db_subnet_group.resume.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = true
}

output "database_url" {
  value     = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.resume.address}:5432/resume"
  sensitive = true
}
