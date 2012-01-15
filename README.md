# rex

  Rex is a tool for Linux machines to remotely execute processes in a virtual environment using your local machine's file system for i/o.

## Installation

    $ npm install -g rex

## Usage

    $ rex --remote_host=user@hostname:port [--tunnel_port=7265] "--command=ls -l /"

## Setup

  Rex uses SSH for it's communication between machines; each machine must be able to access eachother via public/private keys in order to function.

### Remote config

  The remote machine will need to have an account you can authorize as, and it will also need to be able to authorize back to your account/machine in order to perform file i/o.

  If an account already exists on the remote machine that you'd like to use, please skip ahead. However, if you don't, then you'll need to create one:

    $ useradd remote_rex_user

  Next, switch to the new user and generate a pair of keys for authentication like so:

    $ sudo -u remote_rex_user -s
    $ ssh-keygen

  Now, copy the new public key back to your original machine so that rex can connect back without a password:

    $ ssh-copy-id youraccount@yourmachine

  Finally, since rex needs to run with elevated privileges in order to setup the virtual environment, you'll need to add this new user to your sudoers list:

    $ echo remote_rex_user ALL=PASSWD: ALL, NOPASSWD: /usr/local/bin/rex >> /etc/sudoers

### Local config

  To configure your account on your local machine, you'll need to also generate a pair of keys:

    $ ssh-keygen

  And then, you need to copy your public key to the remote user you created on the remote machine so rex can connect without a password:

    $ ssh-copy-id remote_rex_user@remotemachine