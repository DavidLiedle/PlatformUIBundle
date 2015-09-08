<?php

/**
 * File containing the RoleController class.
 *
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\PlatformUIBundle\Controller;

use eZ\Publish\API\Repository\Exceptions\NotFoundException;
use eZ\Publish\API\Repository\RoleService;
use eZ\Publish\Core\MVC\Symfony\Security\Authorization\Attribute;
use eZ\Publish\Core\Repository\Values\User\RoleCreateStruct;
use EzSystems\RepositoryForms\Data\Mapper\RoleMapper;
use EzSystems\RepositoryForms\Form\ActionDispatcher\ActionDispatcherInterface;
use EzSystems\RepositoryForms\Form\Type\RoleUpdateType;
use Symfony\Component\HttpFoundation\Request;

class RoleController extends Controller
{
    /**
     * @var \eZ\Publish\API\Repository\RoleService
     */
    protected $roleService;

    /**
     * @var ActionDispatcherInterface
     */
    private $actionDispatcher;

    public function __construct(
        RoleService $roleService,
        ActionDispatcherInterface $actionDispatcher
    ) {
        $this->roleService = $roleService;
        $this->actionDispatcher = $actionDispatcher;
    }

    /**
     * Renders the role list.
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function listRolesAction()
    {
        return $this->render('eZPlatformUIBundle:Role:list_roles.html.twig', [
            'roles' => $this->roleService->loadRoles(),
            'can_edit' => $this->isGranted(new Attribute('role', 'update')),
            'can_create' => $this->isGranted(new Attribute('role', 'create')),
            'can_delete' => $this->isGranted(new Attribute('role', 'delete')),
        ]);
    }

    /**
     * Renders a role.
     *
     * @param int $roleId Role ID
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function viewRoleAction($roleId)
    {
        if (!$this->isGranted(new Attribute('role', 'read'))) {
            return $this->forward('eZPlatformUIBundle:Pjax:accessDenied');
        }

        try {
            $role = $this->roleService->loadRole($roleId);
            $roleAssignments = $this->roleService->getRoleAssignments($role);
        } catch (NotFoundException $e) {
            $this->notifyError('role.error.role_not_found', [], 'role');

            return $this->redirect($this->generateUrl('admin_roleList'));
        }

        return $this->render('eZPlatformUIBundle:Role:view_role.html.twig', [
            'role' => $role,
            'role_assignments' => $roleAssignments,
            'can_edit' => $this->isGranted(new Attribute('role', 'update')),
            'can_delete' => $this->isGranted(new Attribute('role', 'delete')),
        ]);
    }

    /**
     * Creates a role.
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function createRoleAction()
    {
        if (!$this->isGranted(new Attribute('role', 'update'))) {
            return $this->forward('eZPlatformUIBundle:Pjax:accessDenied');
        }

        $roleCreateStruct = new RoleCreateStruct(['identifier' => '__new__' . md5(microtime(true))]);
        $role = $this->roleService->createRole($roleCreateStruct);

        return $this->redirectToRoute('admin_roleUpdate', ['roleId' => $role->id]);
    }

    /**
     * Updates a role.
     *
     * @param int $roleId Role ID
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function updateRoleAction(Request $request, $roleId)
    {
        if (!$this->isGranted(new Attribute('role', 'update'))) {
            return $this->forward('eZPlatformUIBundle:Pjax:accessDenied');
        }

        try {
            $role = $this->roleService->loadRole($roleId);
        } catch (NotFoundException $e) {
            $this->notifyError('role.error.role_not_found', [], 'role');

            return $this->redirectToRoute('admin_roleList');
        }

        $roleData = (new RoleMapper())->mapToFormData($role);
        $form = $this->createForm(new RoleUpdateType(), $roleData);
        $actionUrl = $this->generateUrl('admin_roleUpdate', ['roleId' => $roleId]);

        // Synchronize form and data.
        $form->handleRequest($request);
        $hasErrors = false;
        if ($form->isValid()) {
            $this->actionDispatcher->dispatchFormAction($form, $roleData, $form->getClickedButton()->getName());
            if ($response = $this->actionDispatcher->getResponse()) {
                return $response;
            }

            return $this->redirect($actionUrl);
        } elseif ($form->isSubmitted()) {
            $hasErrors = true;
        }

        // TODO: Just a temporary implementation of draft handling. To be done properly in follow-up: EZP-24701
        $formView = $form->createView();
        $roleName = $role->identifier;
        if (preg_match('/^__new__[a-z0-9]{32}$/', $roleName) === 1) {
            $roleName = 'role.name_new';
            $formView->vars['role_input_value'] = '';
        } else {
            $formView->vars['role_input_value'] = $roleName;
        }

        return $this->render('eZPlatformUIBundle:Role:update_role.html.twig', [
            'form' => $formView,
            'action_url' => $actionUrl,
            'role' => $role,
            'role_name' => $roleName,
            'hasErrors' => $hasErrors,
        ]);
    }

    /**
     * Deletes a role.
     *
     * @param int $roleId Role ID
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function deleteRoleAction($roleId)
    {
        if (!$this->isGranted(new Attribute('role', 'delete'))) {
            return $this->forward('eZPlatformUIBundle:Pjax:accessDenied');
        }

        try {
            $role = $this->roleService->loadRole($roleId);
            $this->roleService->deleterole($role);
        } catch (NotFoundException $e) {
            $this->notifyError('role.error.role_not_found', [], 'role');

            return $this->redirectToRoute('admin_roleList');
        }

        return $this->redirectToRoute('admin_roleList');
    }
}
