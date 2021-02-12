import { Component, Input, OnInit } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
import { DotCMSContentType } from 'dotcms-models';

@Component({
    selector: 'dot-relationship-tree',
    templateUrl: './dot-relationship-tree.component.html',
    styleUrls: ['./dot-relationship-tree.component.scss']
})
export class DotRelationshipTreeComponent implements OnInit {
    @Input() velocityVar: string;
    @Input() contentType: DotCMSContentType;

    isRelationshipChild: boolean = false;
    relatedContentType: string;
    fieldName: string;
    child: string;
    parent: string;

    constructor() {}

    ngOnInit(): void {
        // If velocityVar has a dot it means it's the child of the relationship
        this.isRelationshipChild = this.velocityVar.indexOf('.') !== -1;
        const [relatedContentType, fieldName] = this.velocityVar.split('.');

        console.log(this.contentType.baseType);

        if (this.isRelationshipChild) {
            this.child = relatedContentType;
            this.parent = this.contentType.name;
            this.fieldName = fieldName;
        } else {
            this.parent = relatedContentType;
            this.child = this.contentType.name;
        }
    }
}
