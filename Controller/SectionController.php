<?php
/**
 * File containing the SectionController class.
 *
 * @copyright Copyright (C) 1999-2014 eZ Systems AS. All rights reserved.
 * @license http://www.gnu.org/licenses/gpl-2.0.txt GNU General Public License v2
 * @version //autogentag//
 */

namespace EzSystems\PlatformUIBundle\Controller;

use eZ\Publish\API\Repository\Exceptions\UnauthorizedException;
use Symfony\Component\HttpFoundation\Response;
use EzSystems\PlatformUIBundle\Controller\PjaxController;
use EzSystems\PlatformUIBundle\Helper\SectionHelperInterface;

class SectionController extends PjaxController
{
    /**
     * @var EzSystems\PlatformUIBundle\Helper\SectionHelperInterface
     */
    protected $sectionHelper;

    public function __construct( SectionHelperInterface $sectionHelper )
    {
        $this->sectionHelper = $sectionHelper;
    }

    /**
     * Renders the section list
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function listAction()
    {
        $response = new Response();
        try
        {
            $sectionList = $this->sectionHelper->getSectionList();
            return $this->render(
                'eZPlatformUIBundle:Section:list.html.twig',
                array(
                    'sectionInfoList' => $this->sectionHelper->getSectionList(),
                    'canCreate' => $this->sectionHelper->canCreate(),
                ),
                $response
            );
        }
        catch ( UnauthorizedException $e )
        {
            $response->setStatusCode( $this->getNoAccessStatusCode() );
        }
        return $response;
    }
}