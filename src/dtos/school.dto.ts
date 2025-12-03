import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SchoolDTO {
  @IsOptional()
  @IsString()
  id?: string; // unique identifier for the school

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
  
  @IsString()
  @IsNotEmpty()
  address!: string;
  
  @IsOptional()
  @IsString()
  website?: string;
  
  @IsOptional()
  @IsString()
  description?: string;
  
  @IsOptional()
  @IsString()
  logo?: string; // the logo url of the school from cloudinary
}
