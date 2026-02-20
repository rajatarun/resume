variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "db_username" {
  type    = string
  default = "resume"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "allowed_cidrs" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}
