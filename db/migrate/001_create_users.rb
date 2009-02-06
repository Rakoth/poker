class CreateUsers < ActiveRecord::Migration
  def self.up
    create_table :users do |t|
      t.string :login
      t.string :crypted_password
      t.string :salt
      t.integer :type
      t.string :email
      t.decimal :cash, :default => 0, :precision => 10, :scale => 2
      t.integer :chips, :default => 1000
      t.integer :level, :default => 0

      t.timestamps
    end
  end

  def self.down
    drop_table :users
  end
end
