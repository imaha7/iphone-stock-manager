import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { IphonesService } from './iphones.service';
import { CreateIphoneDto } from './dto/create-iphone.dto';
import { UpdateIphoneDto } from './dto/update-iphone.dto';

@Controller('iphones')
export class IphonesController {
  constructor(private readonly iphonesService: IphonesService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.iphonesService.findAll({ status, search });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.iphonesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateIphoneDto) {
    return this.iphonesService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIphoneDto,
  ) {
    return this.iphonesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.iphonesService.remove(id);
  }
}
