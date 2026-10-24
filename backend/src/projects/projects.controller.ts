import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListProjectsQueryDto } from './dto/project.dto.js';
import { toPublicProject } from './project.types.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Query() query: ListProjectsQueryDto) {
    return this.projects.listPublished(query.category).map(toPublicProject);
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return toPublicProject(this.projects.getPublishedBySlug(slug));
  }
}
